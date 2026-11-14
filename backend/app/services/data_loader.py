import pandas as pd
from pathlib import Path
from typing import Dict, List

# Global cache for datasets
_DATASET_CACHE: Dict[str, pd.DataFrame] = {}

# Base directory of the project (two levels up from this file)
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data" / "processed"

def _load_dataset(dataset_name: str) -> pd.DataFrame:
    """Load a dataset CSV into a DataFrame and cache it.
    Raises FileNotFoundError if the CSV does not exist.
    """
    csv_path = DATA_DIR / f"{dataset_name}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {csv_path}")
    df = pd.read_csv(csv_path)
    _DATASET_CACHE[dataset_name] = df
    return df

def get_dataset(dataset_name: str) -> pd.DataFrame:
    """Return a DataFrame for the given dataset name.
    The dataset_name should be the file name without the .csv extension.
    """
    if dataset_name in _DATASET_CACHE:
        return _DATASET_CACHE[dataset_name]
    return _load_dataset(dataset_name)

def list_datasets() -> List[Dict[str, any]]:
    """Return a list of available datasets with basic info.
    Each entry contains `name`, `num_records`, and `columns`.
    """
    datasets = []
    for csv_file in DATA_DIR.glob("*.csv"):
        name = csv_file.stem  # filename without extension
        df = pd.read_csv(csv_file, nrows=5)  # preview for columns
        datasets.append({
            "name": name,
            "num_records": pd.read_csv(csv_file).shape[0],
            "columns": df.columns.tolist(),
        })
    return datasets

def get_dataset_schema(dataset_name: str) -> Dict[str, str] | None:
    """Return a schema mapping column name -> pandas dtype name for the dataset.
    Returns None if the dataset is not found.
    """
    try:
        df = get_dataset(dataset_name)
    except FileNotFoundError:
        return None
    # Convert pandas dtypes to simple strings
    schema = {col: str(dtype) for col, dtype in df.dtypes.items()}
    return schema

def load_all_datasets() -> None:
    """Pre‑load all CSV files into the cache. Useful at startup.
    """
    for csv_file in DATA_DIR.glob("*.csv"):
        name = csv_file.stem
        if name not in _DATASET_CACHE:
            _load_dataset(name)
def get_dataset_slice(dataset_name: str, skip: int = 0, limit: int = 100) -> pd.DataFrame:
    """Return a slice of rows for pagination.
    Parameters
    ----------
    dataset_name: str
        Name of the dataset (CSV file without extension).
    skip: int
        Number of rows to skip (offset).
    limit: int
        Maximum number of rows to return (capped by caller).
    """
    df = get_dataset(dataset_name)
    return df.iloc[skip : skip + limit]


def get_dataset_statistics(dataset_name: str) -> dict | None:
    """Calculate basic statistics for numeric columns.
    Returns a mapping:
        column_name -> {"count": int, "missing": int, "mean": float, "median": float, "min": float, "max": float}
    Non‑numeric columns are omitted.
    """
    try:
        df = get_dataset(dataset_name)
    except FileNotFoundError:
        return None
    numeric_df = df.select_dtypes(include=["number"])
    if numeric_df.empty:
        return {}
    stats = {}
    for col in numeric_df.columns:
        series = numeric_df[col]
        stats[col] = {
            "count": int(series.count()),
            "missing": int(series.isna().sum()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "min": float(series.min()),
            "max": float(series.max()),
        }
    return stats
