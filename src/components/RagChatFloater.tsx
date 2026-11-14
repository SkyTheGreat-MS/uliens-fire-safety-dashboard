import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronRight, FileText, Send, Sparkles, X } from 'lucide-react';
import flameIcon from '../assets/flame-icon.png';
import {
  SUGGESTED_RAG_PROMPTS,
  queryNasaFlightCorpus,
  type RagResponse,
} from '../services/nasaFlightCorpus';

export interface RagCitation {
  source: string;
  page?: number | string;
  snippet?: string;
}

export interface RagQueryResult {
  prompt: string;
  response: string;
  citations?: RagCitation[];
  timestamp: string;
}

interface RagChatFloaterProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional hook for connecting to the backend query API endpoint
   * e.g., POST /api/rag/query or pipeline inference
   */
  onSendQuery?: (prompt: string) => Promise<RagQueryResult> | void;
}

export function RagChatFloater({ isOpen, onClose, onSendQuery }: RagChatFloaterProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RagQueryResult | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle click outside & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  const executeQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);

    try {
      if (onSendQuery) {
        const backendResponse = await onSendQuery(trimmed);
        if (backendResponse) {
          setResult(backendResponse);
          setPrompt('');
          return;
        }
      }

      // Query the grounded 8-document NASA flight corpus
      const localResponse: RagResponse = queryNasaFlightCorpus(trimmed);
      setResult({
        prompt: localResponse.prompt,
        response: localResponse.response,
        citations: localResponse.citations,
        timestamp: localResponse.timestamp,
      });
      setPrompt('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeQuery(prompt);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label="FLAMIE Flight Science Assistant"
      className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[540px] max-w-[calc(100vw-24px)] flex-col border border-line bg-surface p-3 shadow-2xl animate-[drawer-enter_120ms_linear] motion-reduce:animate-none"
    >
      {/* 1. Header: Matches Section Head & Design System Typography */}
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2.5">
          <img
            src={flameIcon}
            alt="FLAMIE Icon"
            className="size-8 object-contain drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-[12px] font-bold uppercase tracking-[.08em] text-ink">
                FLAMIE
              </span>
              <span className="flex items-center gap-1 border border-success/60 bg-success/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                <span>8 NASA PDFs</span>
              </span>
            </div>
            <p className="m-0 font-sans text-[11px] font-normal text-secondary">
              Flight Science Assistant · BASS, Saffire &amp; FLEX
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Assistant"
          className="grid size-6 place-items-center border border-line bg-void text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 2. Output Display Area: Avionics Finding Card (Unchunked & Clean) */}
      <div className="mt-2.5 flex min-h-[190px] max-h-[360px] flex-col overflow-y-auto border border-line bg-void p-3 font-sans">
        {isLoading ? (
          <div className="flex h-full min-h-[150px] flex-col items-center justify-center gap-2 text-center">
            <span className="size-4 animate-spin border-2 border-primary border-t-transparent" />
            <span className="font-sans text-[12px] text-secondary">
              Retrieving flight science telemetry...
            </span>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-2.5">
            {/* Operator Query Card */}
            <div className="border border-line bg-surface/50 p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted">
                <span className="font-bold uppercase tracking-wider text-secondary">FLIGHT INQUIRY</span>
                <span className="tabular-nums">{result.timestamp}</span>
              </div>
              <p className="m-0 font-sans text-[12px] font-medium text-ink">
                {result.prompt}
              </p>
            </div>

            {/* Direct Avionics Finding (Concise, Unchunked Answer) */}
            <div className="border border-line bg-surface p-2.5">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[10px]">
                <span className="flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>FLIGHT SCIENCE FINDING</span>
                </span>
                {result.citations && result.citations[0] && (
                  <span className="inline-flex items-center gap-1 border border-line bg-void px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    <FileText className="size-2.5 text-primary" />
                    <span>{result.citations[0].source}</span>
                    {result.citations[0].page && (
                      <span className="text-secondary">· p.{result.citations[0].page}</span>
                    )}
                  </span>
                )}
              </div>

              {/* Crisp, Direct Finding Statement */}
              <p className="m-0 font-sans text-[12px] leading-relaxed text-ink">
                {result.response}
              </p>

              {/* Additional Reference Citations */}
              {result.citations && result.citations.length > 1 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line/40 pt-1.5 font-mono text-[10px]">
                  <span className="uppercase tracking-wider text-muted">Additional Ref:</span>
                  {result.citations.slice(1).map((cite, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 border border-line bg-void px-1.5 py-0.5 text-secondary"
                    >
                      <span className="text-primary">{cite.source}</span>
                      {cite.page && <span>· p.{cite.page}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] flex-col justify-between py-0.5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-heading text-[12px] font-bold uppercase tracking-[.08em] text-ink">
                  FLAMIE
                </span>
                <span className="font-mono text-[10px] text-muted">STANDBY · TIER 2</span>
              </div>
              <p className="m-0 mt-1 font-sans text-[11px] leading-relaxed text-secondary">
                Direct microgravity combustion science answers grounded in 8 NASA flight experiment reports.
              </p>
            </div>

            {/* Suggested Flight Inquiries */}
            <div className="mt-2.5">
              <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                <Sparkles className="size-2.5 text-primary" />
                <span>Suggested Flight Inquiries</span>
              </div>
              <div className="grid gap-1">
                {SUGGESTED_RAG_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => executeQuery(p)}
                    className="flex items-center justify-between border border-line bg-surface/70 px-2 py-1 text-left font-sans text-[11.5px] font-medium text-secondary transition-colors hover:border-primary/60 hover:bg-raised hover:text-ink"
                  >
                    <span className="truncate">{p}</span>
                    <ChevronRight className="size-3 shrink-0 text-muted" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Query Input Form: Design System Field Styling */}
      <form onSubmit={handleSubmit} className="mt-2.5 flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask FLAMIE about airflow paradox, quench speed, or NASA standards..."
          className="flex-1 border border-line bg-void px-2.5 py-1.5 font-sans text-[12px] text-ink placeholder:font-sans placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="flex items-center gap-1 border border-primary bg-primary/15 px-3 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[.06em] text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted"
        >
          <Send className="size-3" />
          <span>Send</span>
        </button>
      </form>

      {/* 4. Footer Metadata */}
      <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-1.5 font-mono text-[10px] text-muted">
        <span>FLAMIE · Grounded in 8 NASA Flight PDFs</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
