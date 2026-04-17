import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function AuditLogPage() {
  const shopId = await requireShopId();

  const [shop, logs] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId } }),
    prisma.shopAuditLog.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-slate-600">
          Showing the most recent activity for {shop.name} only. Other shops cannot be viewed from this session.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Shop Activity</h2>
          <p className="mt-1 text-sm text-slate-500">Newest first. Showing up to 250 entries.</p>
        </div>

        {logs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">When</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{log.action}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{log.entityType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{log.entityId || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-500">No activity has been logged for this shop yet.</div>
        )}
      </div>
    </div>
  );
}
