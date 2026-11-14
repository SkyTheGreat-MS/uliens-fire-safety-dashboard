import { useState } from 'react';
import { RagChatFloater } from './RagChatFloater';

export function Header() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <header className="relative flex min-h-[72px] min-w-0 items-center justify-between gap-3 border border-line bg-surface p-2.5 sm:px-3 sm:py-2.5">
      {/* Intro Text Section */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className="grid size-8 place-items-center border border-primary bg-primary/10 font-mono text-[12px] font-bold text-primary"
          aria-hidden="true"
        >
          ECL
        </div>
        <div>
          <h1 className="m-0 font-heading text-[18px] font-bold leading-tight tracking-[.02em] text-ink sm:text-[22px]">
            ECLSS Flight Deck
          </h1>
          <p className="m-0 font-sans text-[11.5px] tracking-[.03em] text-secondary sm:text-[12.5px]">
            Environmental Control &amp; Life Support · Interface Study
          </p>
        </div>
      </div>

      {/* Chatbot Trigger Button & Floater */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
          aria-label="Toggle RAG Reference Copilot"
          className={`flex items-center gap-2 border px-2 py-1.5 transition-colors ${
            isChatOpen
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-line bg-void text-secondary hover:border-primary hover:bg-raised'
          }`}
        >
          <img
            src="/Ethereal%20Teal%20Spirit%20Flame.png"
            alt="Chatbot Icon"
            className="size-6 object-contain sm:size-7"
          />
          <div className="hidden flex-col text-left sm:flex">
            <span className="font-mono text-[12px] font-bold uppercase tracking-[.08em] text-ink">
              RAG Copilot
            </span>
            <span className="font-mono text-[10px] font-medium text-primary">
              Flight References
            </span>
          </div>
        </button>

        {/* Anchored Popover Floater */}
        <RagChatFloater
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </header>
  );
}
