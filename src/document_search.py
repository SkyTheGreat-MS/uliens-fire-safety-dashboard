import os
import textwrap
import warnings
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from chromadb.utils import embedding_functions

# Suppress harmless HuggingFace token notices and thread warnings
warnings.filterwarnings("ignore", message=".*unauthenticated requests.*")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# =====================================================================
# 1. HACKATHON CONFIGURATION (THE ONLY PART YOU TOUCH ON COMPETITION DAY)
# =====================================================================
# Point this to wherever you dump NASA's downloaded PDFs:
PDF_SOURCE_DIR = r"data/raw"  # e.g., "practice_pdfs" or "data/raw"

# Persistent database storage on local disk
CHROMA_PERSIST_DIR = "./chroma_db"
COLLECTION_NAME = "nasa_flight_evidence"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# 2. INITIALIZE PERSISTENT CHROMADB
client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
collection = client.get_or_create_collection(name=COLLECTION_NAME, embedding_function=emb_fn)

# Map known mission keywords and PDF filename tokens to their official landing pages
SOURCE_LINKS = {
    # BASS Campaign (Burning and Suppression of Solids)
    "bass-ii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    "bass_ii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    "psi-25": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    "bass": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-26",
    "psi-26": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-26",

    # Saffire Campaign (Spacecraft Fire Safety Demonstration)
    "saffire-iii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    "saffire_iii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    "saffire-3": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    "psi-100": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    "saffire-ii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-99",
    "saffire_ii": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-99",
    "saffire-2": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-99",
    "psi-99": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-99",
    "saffire": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-98",
    "psi-98": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-98",

    # Extinguishment & Droplet Combustion
    "flex": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
    "psi-69": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",

    # Regulatory Standards & Spaceflight Heritage
    "apollo": "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1",
    "mir": "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/",
    "guide": "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
    "combustion_mini_book": "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
    "6001": "https://standards.nasa.gov/standard/NASA/NASA-STD-6001",
    "3001": "https://standards.nasa.gov/standard/NASA/NASA-STD-3001-Vol-2",
}

DEFAULT_SOURCE_URL = "https://psi.nasa.gov/physci/repo/search?q=combustion"


def resolve_source_url(filename_or_text: str) -> str:
    """Matches text or filename against known sources, checking specific variants first."""
    target = str(filename_or_text).lower()
    for key, url in SOURCE_LINKS.items():
        if key in target:
            return url
    return DEFAULT_SOURCE_URL

def ingest_all_pdfs(source_folder: str = PDF_SOURCE_DIR) -> int:
    """
    Scans the folder, chunks all PDFs page-by-page, tags metadata,
    and commits them to local ChromaDB disk storage.
    """
    # Defensive path check: handles running from root or subfolders
    valid_path = source_folder
    if not os.path.exists(valid_path):
        valid_path = os.path.join("..", source_folder)
    if not os.path.exists(valid_path):
        print(f"[ERROR] Could not find folder: {source_folder}")
        return 0

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    all_chunks = []
    all_metadatas = []
    all_ids = []
    chunk_counter = collection.count()

    pdf_files = [f for f in sorted(os.listdir(valid_path)) if f.lower().endswith(".pdf")]
    print(f"[*] Found {len(pdf_files)} PDF(s) in '{os.path.abspath(valid_path)}'. Ingesting...")

    for filename in pdf_files:
        filepath = os.path.join(valid_path, filename)
        try:
            reader = PdfReader(filepath)
        except Exception as e:
            print(f"[WARNING] Skipping unreadable PDF '{filename}': {e}")
            continue

        # Detect investigation tag from filename
        # Cleanly identify mission and experimental facility from filename
        fname_lower = filename.lower()

        if "saffire" in fname_lower:
            if "iii" in fname_lower or "-3" in fname_lower:
                investigation = "Saffire-III / Cygnus"
            elif "ii" in fname_lower or "-2" in fname_lower:
                investigation = "Saffire-II / Cygnus"
            else:
                investigation = "Saffire-I / Cygnus"
        elif (
            "bass" in fname_lower
            or "070he" in fname_lower
            or "national meeting" in fname_lower
        ):
            if "bass-ii" in fname_lower or "bass_ii" in fname_lower:
                investigation = "BASS-II / MSG"
            else:
                investigation = "BASS-I / MSG"
        elif "flex" in fname_lower:
            investigation = "FLEX / CIR"
        elif "mini-book" in fname_lower or "researcher" in fname_lower:
            investigation = "NASA ISS Program / GRC"
        else:
            investigation = "NASA Microgravity Archive"

        # Extract and process each PDF page individually
    for page_idx, page in enumerate(reader.pages):
        try:
            raw_text = page.extract_text() or ""
        except Exception as e:
            print(
                f"[WARNING] Could not extract page {page_idx + 1} "
                f"from '{filename}': {e}"
            )
            continue

        # Skip pages without extractable text
        if not raw_text.strip():
            continue

        # Page-isolated splitting prevents text bleeding across pages
        for chunk in splitter.split_text(raw_text):
            clean_chunk = chunk.strip()
            
            all_chunks.append(clean_chunk)

            all_metadatas.append({
                "source_title": os.path.splitext(filename)[0],
                "page": page_idx + 1,
                "investigation": investigation,
                "source_url": resolve_source_url(filename)
            })

            all_ids.append(f"chunk_{chunk_counter}")
            chunk_counter += 1

    if all_chunks:
        collection.add(documents=all_chunks, metadatas=all_metadatas, ids=all_ids)
        print(f"[+] Successfully indexed {len(all_chunks)} chunks to disk.")

    return len(all_chunks)

##
def search_nasa_evidence(query: str, n_results: int = 2) -> list[dict]:
    """
    THE PRODUCTION API EXPORT:
    FastAPI imports and calls this. Returns clean Python dictionaries
    ready for JSON serialization. No terminal prompts.
    """
    if collection.count() == 0:
        return []

    # Pure semantic query across all missions (no brittle keyword pre-filters)
    raw_results = collection.query(query_texts=[query], n_results=n_results)

    if not raw_results["documents"] or not raw_results["documents"][0]:
        return []

    documents = raw_results["documents"][0]
    metadatas = raw_results["metadatas"][0]
    ids = raw_results["ids"][0]
    distances = raw_results.get("distances", [[0.0] * len(documents)])[0]

    output_cards = []
    for doc_id, text, meta, dist in zip(ids, documents, metadatas, distances):
        # Exclude literature bibliographies and citations
        #if "proceedings of" in text.lower() or "handbook of" in text.lower():
            #continue

        words = text.split()
        summary_finding = " ".join(words[:45]) + ("..." if len(words) > 45 else "")

        output_cards.append({
            "id": doc_id,
            "tag": "NASA FLIGHT ARCHIVE // RETRIEVED EVIDENCE",
            "finding": summary_finding, #you should only need to show this in front end
            "full_text": text,
            "source_title": meta.get("source_title", "NASA Flight Report"),
			"investigation": meta.get("investigation", "NASA Microgravity"),
			"page_number": meta.get("page", 1),
            "similarity_score": round(max(0.0, 1.0 - dist), 2),
            "source_url": meta.get("source_url", "https://psi.nasa.gov/physci/repo/search?q=combustion")
        })

    return output_cards


# =====================================================================
# TEST RUNNER BLOCK: Runs when you test locally on your laptop
# =====================================================================
if __name__ == "__main__":
    # Ingest if disk database is empty
    if collection.count() == 0:
        ingest_all_pdfs(PDF_SOURCE_DIR)
    else:
        print(f"[READY] Cached database found with {collection.count()} chunks.")

    # Quick smoke test query
    test_query = "What happens to flame extinction when airflow drops?"
    print(f"\nQUERY: '{test_query}'")
    results = search_nasa_evidence(test_query, n_results=2)

    for r in results:
        print(f"\n[{r['investigation']} - Page {r['page_number']}] Match: {r['similarity_score']}")
        print(textwrap.fill(f"\"{r['finding']}\"", width=70))
        print(f"Source: {r['source_title']}")