export function MetricsCards({
  totals,
  unassigned,
}: {
  totals: { totalJobs: number; totalHoursWip: number; totalRemainingHours: number };
  unassigned: { totalJobs: number; totalHours: number; remainingHours: number };
}) {
  const cards = [
    { label: "Total Jobs WIP", value: totals.totalJobs },
    { label: "Total Hours WIP", value: totals.totalHoursWip },
    { label: "Remaining Hours WIP", value: totals.totalRemainingHours },
    { label: "Jobs to Handout", value: unassigned.totalJobs },
    { label: "Hours to Handout", value: unassigned.totalHours },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
