"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function QuickStart() {
  const [text, setText] = useState("");
  const router = useRouter();

  function start() {
    const q = new URLSearchParams();
    if (text.trim()) q.set("idea", text.trim());
    router.push(`/builder?${q.toString()}`);
  }

  return (
    <motion.section className="glass p-4 rounded-xl" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Quick start a new project here</div>
        <div className="text-xs flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-white/10">$70/hr</span>
          <span className="px-2 py-1 rounded-full bg-white/10">Est. 2-3w</span>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your project or paste a doc to begin..."
        className="w-full h-28 bg-transparent outline-none"
      />
      <div className="flex items-center justify-end mt-3 gap-2">
        <button onClick={start} className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25">
          Start building →
        </button>
      </div>
    </motion.section>
  );
}


