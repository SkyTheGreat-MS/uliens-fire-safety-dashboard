import { useState } from 'react';
import { RagChatFloater } from './RagChatFloater';

export function Header() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <header className="relative flex min-h-[72px] min-w-0 items-center justify-between gap-3 border border-line bg-surface p-2.5 sm:px-3 sm:py-2.5">
      {/* Intro Text Section */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className="grid size-8 place-items-center border border-cyan font-mono text-[11px] font-bold text-cyan"
          aria-hidden="true"
        >
          ECL
        </div>
        <div>
          <h1 className="m-0 font-mono text-[16px] font-bold leading-tight tracking-[.05em] text-ink sm:text-[19px]">
            ECLSS Flight Deck
          </h1>
          <p className="m-0 font-mono text-[9.5px] tracking-[.06em] text-secondary sm:text-[10.5px]">
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
              ? 'border-cyan bg-cyan/10 text-cyan'
              : 'border-line bg-[#0a0d13] text-secondary hover:border-cyan hover:bg-[#10151f]'
          }`}
        >
          <img
            src="/Ethereal%20Teal%20Spirit%20Flame.png"
            alt="Chatbot Icon"
            className="size-6 object-contain sm:size-7"
          />
          <div className="hidden flex-col text-left sm:flex">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.08em] text-ink">
              RAG Copilot
            </span>
            <span className="font-mono text-[8.5px] text-cyan">
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
