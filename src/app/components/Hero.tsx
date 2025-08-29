"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl md:text-5xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          100% AI-Driven All-Stack Project Builder
        </motion.h1>
        <motion.p
          className="text-neutral-300 mt-4 md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Generate production-ready plans, architecture diagrams, and scaffold code across stacks.
        </motion.p>
        <motion.div
          className="mt-8 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <a href="/builder" className="glass px-5 py-3 rounded-lg">Open Builder</a>
          <a href="/" className="px-5 py-3 rounded-lg border border-white/20">Live Diagram</a>
        </motion.div>
      </div>
    </section>
  );
}


