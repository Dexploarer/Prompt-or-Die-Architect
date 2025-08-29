"use client";

import { motion } from "framer-motion";

type Section = {
  name: string;
  progress: number;
};

export function AgentPanel({ sections }: { sections: Section[] }) {
  const total = sections.reduce((a, s) => a + s.progress, 0) / (sections.length || 1);
  return (
    <aside className="glass p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Agent</div>
        <div className="text-xs opacity-70">{Math.round(total)}%</div>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.name}>
            <div className="text-xs mb-1 opacity-80">{s.name}</div>
            <div className="h-2 bg-white/10 rounded">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.progress}%` }}
                transition={{ duration: 0.6 }}
                className="h-2 bg-white/60 rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}


