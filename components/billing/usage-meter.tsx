"use client";

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number | null;  // null = unlimited
  unit: string;
}

export function UsageMeter({ label, current, limit, unit }: UsageMeterProps) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const atLimit = !isUnlimited && current >= limit;
  const nearLimit = !isUnlimited && pct >= 80;

  const barColor = atLimit
    ? "bg-rose-500"
    : nearLimit
    ? "bg-amber-500"
    : "bg-emerald-500";

  const textColor = atLimit
    ? "text-rose-600 dark:text-rose-400"
    : nearLimit
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {atLimit && (
          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            Limit Reached
          </span>
        )}
      </div>

      <div>
        <p className={`text-xl font-bold ${textColor}`}>
          {current.toLocaleString("en-BD")}
          {!isUnlimited && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {limit!.toLocaleString("en-BD")} {unit}
            </span>
          )}
        </p>
        {isUnlimited && (
          <p className="text-xs text-muted-foreground mt-0.5">Unlimited {unit}</p>
        )}
      </div>

      {!isUnlimited && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={current}
              aria-valuemax={limit!}
              aria-label={label}
            />
          </div>
          <p className="text-right text-[10px] text-muted-foreground">{Math.round(pct)}% used</p>
        </div>
      )}
    </div>
  );
}
