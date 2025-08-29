"use client";

import { motion } from "framer-motion";
import { Brain, Boxes, Code2 } from "lucide-react";

const steps = [
  {
    title: "Paste a paragraph",
    desc: "Drop an idea or spec. We’ll generate a graph and a plan.",
    icon: Brain,
  },
  {
    title: "Generate architecture",
    desc: "React Flow + ELK auto-layout, with AI suggestions.",
    icon: Boxes,
  },
  {
    title: "Scaffold code",
    desc: "Create a real monorepo, API, frontend, and docs.",
    icon: Code2,
  },
];

export function HowItWorks() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-6">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="glass p-4 rounded-xl"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <s.icon className="w-5 h-5 mb-3 opacity-80" />
              <div className="text-sm font-semibold mb-1">{s.title}</div>
              <div className="text-xs opacity-80">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


