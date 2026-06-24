export function Icon({ path, className, strokeWidth = 1.8, size }: { path: string; className?: string; strokeWidth?: number; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className ?? "h-5 w-5"}>
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
