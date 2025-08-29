"use client";

import React from "react";

type Section = { heading: string; content: string; bullets?: string[] };
type BacklogItem = { id: string; title: string; priority: "High"|"Medium"|"Low"; assignees?: string[]; est: "S"|"M"|"C" };
type Doc = {
  title: string;
  summary: string;
  sections: Section[];
  backlog: BacklogItem[];
  risks: string[];
  open_questions: string[];
};

export function DocViewer({ json }: { json: string }) {
  let doc: Doc | null = null;
  try { doc = JSON.parse(json); } catch {}
  if (!doc) return <div className="text-xs opacity-70">No document yet.</div>;
  return (
    <div className="space-y-4">
      <div className="glass p-4">
        <div className="text-xl font-bold">{doc.title}</div>
        <div className="text-sm opacity-80 mt-1">{doc.summary}</div>
      </div>
      {doc.sections?.map((s, i) => (
        <div key={i} className="glass p-4">
          <div className="text-lg font-semibold">{s.heading}</div>
          <div className="text-sm mt-1 whitespace-pre-wrap">{s.content}</div>
          {s.bullets?.length ? (
            <ul className="list-disc pl-6 mt-2">
              {s.bullets.map((b, j) => (<li key={j} className="text-sm">{b}</li>))}
            </ul>
          ) : null}
        </div>
      ))}
      <div className="glass p-4">
        <div className="text-lg font-semibold">Backlog</div>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left opacity-70">
              <th className="pr-2">ID</th>
              <th className="pr-2">Title</th>
              <th className="pr-2">Priority</th>
              <th className="pr-2">Est</th>
              <th>Assignees</th>
            </tr>
          </thead>
          <tbody>
            {doc.backlog?.map((b) => (
              <tr key={b.id} className="border-t border-neutral-800">
                <td className="pr-2 py-1">{b.id}</td>
                <td className="pr-2 py-1">{b.title}</td>
                <td className="pr-2 py-1">{b.priority}</td>
                <td className="pr-2 py-1">{b.est}</td>
                <td className="py-1">{b.assignees?.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass p-4">
          <div className="text-lg font-semibold">Risks</div>
          <ul className="list-disc pl-6 mt-2">
            {doc.risks?.map((r, i) => (<li key={i} className="text-sm">{r}</li>))}
          </ul>
        </div>
        <div className="glass p-4">
          <div className="text-lg font-semibold">Open Questions</div>
          <ul className="list-disc pl-6 mt-2">
            {doc.open_questions?.map((q, i) => (<li key={i} className="text-sm">{q}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
}


