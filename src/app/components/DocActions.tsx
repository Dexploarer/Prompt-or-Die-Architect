"use client";

export function DocActions({ plan }: { plan: any }) {
  async function exportPdf() {
    const r = await fetch("/api/docs/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!r.ok) return alert("Failed to export PDF");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(plan?.title || "plan").replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button onClick={exportPdf} className="glass px-4 py-2 rounded-lg">Export PDF</button>
    </div>
  );
}


