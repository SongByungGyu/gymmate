type Props = {
  value: number;
  max: number;
  className?: string;
};

export function Progress({ value, max, className = '' }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2 w-full rounded-full bg-[#E7E7E2] overflow-hidden ${className}`}>
      <div
        className="h-full bg-[#2563EB] transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
