import { useState } from 'react';
import { RagChatFloater } from './RagChatFloater';
import flameIcon from '../assets/flame-icon.png';

export function Header() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <header className="relative flex min-h-[76px] min-w-0 items-center justify-between gap-3 border border-line bg-surface px-3 py-2 sm:px-4 sm:py-2.5">
      {/* Title & Subtitle Section */}
      <div className="flex flex-col justify-center">
        <h1 className="m-0 font-heading text-[24px] font-bold leading-tight tracking-[.01em] text-ink sm:text-[28px]">
          ECLSS Flight Deck
        </h1>
        <p className="m-0 mt-0.5 font-sans text-[12px] font-normal tracking-[.02em] text-secondary sm:text-[13px]">
          Environmental Control &amp; Life Support · Interface Study
        </p>
      </div>

      {/* Standalone Agent Chat Icon Entry & Floater */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
          aria-label="Toggle Agent Chat"
          className="group relative flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <img
            src={flameIcon}
            alt="ECLSS Agent Chat"
            className="h-14 w-auto object-contain transition-transform duration-150 select-none sm:h-16 drop-shadow-[0_0_14px_rgba(52,211,153,0.35)]"
          />
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
