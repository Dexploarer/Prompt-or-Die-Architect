"use client";

export function AnalyticsFloating({ totals }: { totals?: { hours?: number; cost?: number } }) {
  if (!totals) return null;
  return (
    <div className="fixed bottom-6 right-6 glass px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-40">
      <div className="text-xs">HRS</div>
      <div className="text-sm font-semibold">{Math.round(totals.hours || 0)}</div>
      <div className="text-xs ml-3">EST. COST</div>
      <div className="text-sm font-semibold">${Math.round(totals.cost || 0).toLocaleString()}</div>
    </div>
  );
}


