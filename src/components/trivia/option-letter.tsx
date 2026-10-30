/** "A" to "D" beside an option on a card with more than two options. */
export function OptionLetter({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="h-7 w-7 shrink-0 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-xs font-bold text-white/70"
    >
      {String.fromCharCode(65 + index)}
    </span>
  );
}
