/**
 * Q's lettermark — the answer engine on the home page, named for the Bond
 * character: the one who hands back the exact tool for the job, not a
 * briefing on how it was made.
 */
export function QAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 ring-2 ring-teal/40"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        background: "linear-gradient(135deg, var(--color-brand-secondary-500), var(--color-brand-primary))",
      }}
    >
      Q
    </span>
  );
}
