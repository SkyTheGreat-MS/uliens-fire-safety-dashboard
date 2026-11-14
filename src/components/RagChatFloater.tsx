import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FileText, Send, X } from 'lucide-react';
import flameIcon from '../assets/flame-icon.png';

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
    // Delay adding click listener to avoid immediate trigger from opening click
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = prompt.trim();
    if (!query || isLoading) return;

    setIsLoading(true);

    try {
      if (onSendQuery) {
        const response = await onSendQuery(query);
        if (response) {
          setResult(response);
        }
      } else {
        // Fallback response ready for backend hook
        setResult({
          prompt: query,
          response:
            'Awaiting backend connection. Query retrieval from the NASA flight science reference documents (BASS, SAFFIRE, FLEX).',
          citations: [
            { source: 'NASA Flight Science Corpus', snippet: 'Active corpus reference' },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }
      setPrompt('');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label="Flight Science Assistant"
      className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[420px] max-w-[calc(100vw-24px)] flex-col border border-line bg-surface p-3 shadow-2xl"
    >
      {/* Floater Header */}
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <img
            src={flameIcon}
            alt="Assistant Icon"
            className="size-7 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-mono text-[12px] font-bold uppercase tracking-[.06em] text-ink">
              Flight Science Assistant
            </span>
            <p className="m-0 font-mono text-[10.5px] text-secondary">
              NASA Flight Science Reference Corpus
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

      {/* Response Display Area */}
      <div className="mt-2.5 flex min-h-[170px] max-h-[280px] flex-col overflow-y-auto border border-line bg-void p-2.5 font-mono text-[12px]">
        {result ? (
          <div className="flex flex-col gap-2">
            {/* Last Query Prompt */}
            <div className="flex items-start gap-1.5 border-b border-line/60 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Q:</span>
              <span className="text-[12.5px] font-semibold text-ink">{result.prompt}</span>
            </div>

            {/* Response Content */}
            <div className="flex items-start gap-1.5 pt-1 text-[12px] leading-relaxed text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider text-warning">A:</span>
              <div className="flex-1 whitespace-pre-wrap">{result.response}</div>
            </div>

            {/* Citations / Reference Badges */}
            {result.citations && result.citations.length > 0 && (
              <div className="mt-2 border-t border-line/50 pt-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[.08em] text-muted">
                  Referenced Sources
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.citations.map((cite, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-secondary"
                    >
                      <FileText className="size-2.5 text-primary" />
                      <span>{cite.source}</span>
                      {cite.page && <span className="text-muted">p.{cite.page}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 text-right text-[9.5px] text-muted">{result.timestamp}</div>
          </div>
        ) : (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-1.5 text-center">
            <FileText className="size-5 text-secondary/40" />
            <p className="m-0 text-[12px] leading-normal text-secondary">
              Flight reference assistant is ready.
            </p>
            <p className="m-0 font-mono text-[10.5px] leading-normal text-muted">
              Ask questions based on NASA BASS, SAFFIRE &amp; FLEX flight documentation.
            </p>
          </div>
        )}
      </div>

      {/* Query Input Box Form */}
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question based on flight references..."
          className="flex-1 border border-line bg-void px-2.5 py-1.5 font-mono text-[12px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="flex items-center gap-1 border border-primary bg-primary/15 px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.06em] text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted"
        >
          <Send className="size-3" />
          <span>Send</span>
        </button>
      </form>

      {/* Footer Meta */}
      <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-1.5 font-mono text-[10px] text-muted">
        <span>Flight science reference system</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
