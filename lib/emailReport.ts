function formatStatusLabel(status: string) {
  if (status === "needs_work") return "Needs Work";
  if (status === "overloaded") return "Overloaded";
  return "Balanced";
}

function statusStyles(status: string) {
  if (status === "needs_work") {
    return {
      rowBg: "#f0fdf4",
      text: "#166534",
      pillBg: "#dcfce7",
      pillText: "#166534",
    };
  }

  if (status === "overloaded") {
    return {
      rowBg: "#fef2f2",
      text: "#991b1b",
      pillBg: "#fee2e2",
      pillText: "#991b1b",
    };
  }

  return {
    rowBg: "#ffffff",
    text: "#0f172a",
    pillBg: "transparent",
    pillText: "#475569",
  };
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStageChartHtml(stages: Array<{ stage: string; count: number; color: string }>) {
  const safeStages = stages.filter((stage) => stage.count > 0);
  const displayStages = safeStages.length ? safeStages : stages;
  const total = Math.max(displayStages.reduce((sum, stage) => sum + stage.count, 0), 1);

  const barSegmentsHtml = displayStages
    .map((stage) => {
      const widthPct = Math.max((stage.count / total) * 100, stage.count > 0 ? 4 : 0);
      const textColor = stage.color.toLowerCase() === "#facc15" ? "#0f172a" : "#ffffff";
      return `
        <td
          valign="middle"
          align="center"
          title="${escapeHtml(stage.stage)}: ${escapeHtml(stage.count)}"
          style="background:${escapeHtml(stage.color)}; color:${textColor}; width:${widthPct.toFixed(2)}%; min-width:40px; padding:12px 6px; border-right:2px solid #ffffff; font-size:12px; line-height:1; font-weight:700; white-space:nowrap;"
        >
          ${stage.count > 0 ? escapeHtml(stage.count) : "&nbsp;"}
        </td>`;
    })
    .join("");

  const legendItems = displayStages.map(
    (stage) => `
      <td style="padding:5px; vertical-align:top;" width="16.66%">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#f1f5f9; border-radius:12px;">
          <tr>
            <td width="24" style="padding:10px 0 10px 12px; vertical-align:middle;">
              <div style="width:16px; height:24px; line-height:24px; font-size:0; border-radius:999px; background:${escapeHtml(stage.color)};">&nbsp;</div>
            </td>
            <td style="padding:10px 12px 10px 8px; font-size:12px; line-height:1.25; color:#0f172a; font-weight:600; vertical-align:middle;">
              ${escapeHtml(stage.stage)} : ${escapeHtml(stage.count)}
            </td>
          </tr>
        </table>
      </td>`
  );

  const legendRows: string[] = [];
  for (let index = 0; index < legendItems.length; index += 6) {
    const rowItems = [...legendItems.slice(index, index + 6)];
    while (rowItems.length < 6) {
      rowItems.push('<td width="16.66%" style="padding:5px;">&nbsp;</td>');
    }
    legendRows.push(`<tr>${rowItems.join("")}</tr>`);
  }

  const legendTableHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0;">${legendRows.join("")}</table>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:0 0 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; overflow:hidden; border:1px solid #e2e8f0; border-radius:14px;">
            <tr>${barSegmentsHtml}</tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          ${legendTableHtml}
        </td>
      </tr>
    </table>`;
}

export function buildDashboardEmailBodyHtml(params: {
  shopName: string;
  baseUrl: string;
  totals: { totalJobs: number; totalHoursWip: number; totalRemainingHours: number };
  unassigned: { totalJobs: number; totalHours: number; remainingHours: number };
  techRank: Array<{
    rank: number;
    technician: string;
    status: string;
    capacity: number;
    remainingHours: number;
    loadPct: number;
    roHours: number;
    activeJobs: number;
  }>;
  stages: Array<{ stage: string; count: number; color: string }>;
  assignableRows: Array<{
    id?: string;
    roNumber: string;
    owner: string;
    vehicle: string;
    estimator?: string | null;
    stage: string;
    roHours: number;
    remainingHours: number;
  }>;
  towInEstimateRows: Array<{
    id?: string;
    roNumber: string;
    owner: string;
    vehicle: string;
    estimator?: string | null;
    stage: string;
    roHours: number;
    remainingHours: number;
  }>;
}) {
  const baseUrl = params.baseUrl.replace(/\/$/, "");
  const cards = [
    { label: "Total Jobs WIP", value: params.totals.totalJobs },
    { label: "Total Hours WIP", value: params.totals.totalHoursWip },
    { label: "Remaining Hours WIP", value: params.totals.totalRemainingHours },
    { label: "Unassigned Jobs", value: params.unassigned.totalJobs },
    { label: "Unassigned Hours", value: params.unassigned.totalHours },
  ];

  const cardsHtml = cards
    .map(
      (card) => `
        <td style="padding:8px; vertical-align:top;">
          <div style="border:1px solid #e2e8f0; border-radius:16px; background:#ffffff; padding:18px; min-width:150px;">
            <div style="font-size:13px; color:#64748b; margin-bottom:8px;">${escapeHtml(card.label)}</div>
            <div style="font-size:28px; line-height:1.1; font-weight:700; color:#0f172a;">${escapeHtml(card.value)}</div>
          </div>
        </td>`
    )
    .join("");

  const stageChartHtml = buildStageChartHtml(params.stages);

  const techRowsHtml = params.techRank
    .map((row) => {
      const styles = statusStyles(row.status);
      const techUrl = `${baseUrl}/tech/${encodeURIComponent(row.technician)}`;
      const statusText = formatStatusLabel(row.status);
      const statusPill =
        row.status === "normal"
          ? `<span style="color:${styles.pillText}; font-weight:600;">${escapeHtml(statusText)}</span>`
          : `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:${styles.pillBg}; color:${styles.pillText}; font-size:12px; font-weight:700;">${escapeHtml(statusText)}</span>`;

      return `
        <tr style="background:${styles.rowBg};">
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.rank)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">
            <a href="${escapeHtml(techUrl)}" style="color:#1d4ed8; text-decoration:none; font-weight:700;">${escapeHtml(row.technician)}</a>
          </td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">${statusPill}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(row.capacity)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(row.remainingHours)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:${styles.text}; font-weight:700; text-align:right;">${escapeHtml(row.loadPct)}%</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(row.roHours)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(row.activeJobs)}</td>
        </tr>`;
    })
    .join("");

  const assignableRows = params.assignableRows.slice(0, 15);
  const assignableRowsHtml = assignableRows.length
    ? assignableRows
        .map(
          (row) => `
          <tr>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#0f172a;">${escapeHtml(row.roNumber)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.owner)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.vehicle)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.estimator || "—")}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.stage)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(Math.round(row.roHours))}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(Math.round(row.remainingHours))}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="padding:16px 12px; color:#64748b; text-align:center;">No unassigned jobs right now.</td></tr>`;

  const moreAssignableNote =
    params.assignableRows.length > assignableRows.length
      ? `<p style="margin:10px 0 0; color:#64748b; font-size:12px;">Showing the first ${assignableRows.length} unassigned jobs.</p>`
      : "";

  const towInRows = params.towInEstimateRows.slice(0, 15);
  const towInRowsHtml = towInRows.length
    ? towInRows
        .map(
          (row) => `
          <tr>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#0f172a;">${escapeHtml(row.roNumber)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.owner)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.vehicle)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.estimator || "—")}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155;">${escapeHtml(row.stage)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(Math.round(row.roHours))}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; color:#334155; text-align:right;">${escapeHtml(Math.round(row.remainingHours))}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="padding:16px 12px; color:#64748b; text-align:center;">No tow-ins need estimates right now.</td></tr>`;

  const moreTowInNote =
    params.towInEstimateRows.length > towInRows.length
      ? `<p style="margin:10px 0 0; color:#64748b; font-size:12px;">Showing the first ${towInRows.length} tow-ins needing estimate.</p>`
      : "";

  return `
      <div style="max-width:1120px; margin:0 auto;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
          <tr>${cardsHtml}</tr>
        </table>

        <div style="border:1px solid #e2e8f0; border-radius:18px; background:#ffffff; padding:20px; margin-bottom:20px;">
          <h2 style="margin:0 0 14px; font-size:20px; line-height:1.2;">WIP by Stage</h2>
          ${stageChartHtml}
        </div>

        <div style="border:1px solid #e2e8f0; border-radius:18px; background:#ffffff; padding:20px; margin-bottom:20px;">
          <h2 style="margin:0 0 6px; font-size:20px; line-height:1.2;">Who Needs Work</h2>
          <p style="margin:0 0 16px; color:#64748b; font-size:13px;">Click a technician name to open that person&apos;s detail page.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Rank</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Technician</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Status</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Capacity</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Remaining</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Load %</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">RO Hours</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Active Jobs</th>
              </tr>
            </thead>
            <tbody>${techRowsHtml}</tbody>
          </table>
        </div>

        <div style="border:1px solid #e2e8f0; border-radius:18px; background:#ffffff; padding:20px; margin-bottom:20px;">
          <h2 style="margin:0 0 6px; font-size:20px; line-height:1.2;">Cars To Handout</h2>
          <p style="margin:0 0 16px; color:#64748b; font-size:13px;">These jobs are currently unassigned and available to hand out.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">RO #</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Owner</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Vehicle</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Estimator</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Stage</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">RO Hours</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Remaining</th>
              </tr>
            </thead>
            <tbody>${assignableRowsHtml}</tbody>
          </table>
          ${moreAssignableNote}
        </div>

        <div style="border:1px solid #e2e8f0; border-radius:18px; background:#ffffff; padding:20px;">
          <h2 style="margin:0 0 6px; font-size:20px; line-height:1.2;">Tow Ins Needing Estimate</h2>
          <p style="margin:0 0 16px; color:#64748b; font-size:13px;">These unassigned tow-ins have been tagged as needing an estimate before they are ready to hand out.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">RO #</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Owner</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Vehicle</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Estimator</th>
                <th align="left" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Stage</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">RO Hours</th>
                <th align="right" style="padding:0 12px 10px; border-bottom:1px solid #cbd5e1; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Remaining</th>
              </tr>
            </thead>
            <tbody>${towInRowsHtml}</tbody>
          </table>
          ${moreTowInNote}
        </div>
      </div>`;
}

export function buildDashboardEmailHtml(params: Parameters<typeof buildDashboardEmailBodyHtml>[0]) {
  const bodyHtml = buildDashboardEmailBodyHtml(params);
  return `
  <!doctype html>
  <html>
    <body style="margin:0; padding:24px; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">${bodyHtml}</body>
  </html>`;
}
