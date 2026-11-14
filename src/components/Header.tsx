export function Header() {
  return <header className="flex min-h-[88px] min-w-0 flex-col justify-center gap-[7px] border border-line bg-surface p-2.5">
    <div className="flex items-center gap-[9px]">
      <div className="grid size-7 place-items-center border border-cyan font-mono text-[10px] font-bold text-cyan" aria-hidden="true">ECL</div>
      <h1 className="m-0 font-mono text-[12px] font-bold leading-tight tracking-[.04em] text-ink">ECLSS Flight Deck</h1>
    </div>
    <p className="m-0 ml-[37px] text-[9px] tracking-[.08em] text-secondary">Environmental control · Interface study</p>
  </header>;
}
