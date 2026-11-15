import { useState } from 'react';
import { RagChatFloater } from './RagChatFloater';
import flameIcon from '../assets/flame-icon.png';

export function Header() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <header className="relative flex min-h-[76px] min-w-0 items-center justify-between gap-3 bg-surface px-3 py-2 sm:px-4 sm:py-2.5">
      {/* Title & Subtitle Section with PYROIS Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <img
          src={flameIcon}
          alt="PYROIS Logo"
          className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] select-none sm:h-12"
        />
        <div className="flex flex-col justify-center">
          <h1 className="m-0 font-heading text-[17px] font-bold leading-tight tracking-[.01em] text-ink sm:text-[22px] lg:text-[24px]">
            <span>PYROIS</span>{' '}
            <span className="text-[11.5px] font-normal text-secondary sm:text-[13.5px]">
              (Pyrotechnic &amp; Flammability Operational Intelligence System)
            </span>
          </h1>
          <p className="m-0 mt-0.5 font-sans text-[11.5px] font-normal tracking-[.02em] text-secondary sm:text-[12.5px]">
            SI-Driven Microgravity Combustion Analytics
          </p>
        </div>
      </div>

      {/* Standalone Combustion Knowledgebase Entry & Floater */}
      <div className="relative flex items-center gap-2.5">
        <div className="hidden sm:flex flex-col items-end text-right">
          <div className="flex items-center gap-1.5 font-heading text-[12px] font-bold uppercase tracking-[.08em] text-ink">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span>COMBUSTION KNOWLEDGE BASE</span>
          </div>
          <span className="font-mono text-[10px] text-muted">SI-Driven Flight Retrieval</span>
        </div>

        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
          aria-label="Toggle Combustion Knowledgebase"
          className="group relative flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <img
            src={flameIcon}
            alt="Combustion Knowledgebase"
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
