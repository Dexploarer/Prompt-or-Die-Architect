"use client";

import React, { useEffect, useRef, useState } from "react";

type ToolAction =
  | { type: "generate-architecture" }
  | { type: "suggest-improvements" }
  | { type: "export-png" }
  | { type: "export-svg" }
  | { type: "toggle-grid" }
  | { type: "toggle-draw" };

export function ToolDock() {
  const dockRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!drag) return;
      setPos((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
    function onMouseUp() {
      setDrag(null);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag]);

  function dispatch(action: ToolAction) {
    window.dispatchEvent(new CustomEvent("tool-dock", { detail: action }));
  }

  return (
    <div
      ref={dockRef}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      className="fixed z-50 select-none"
    >
      <div
        className="glass rounded-xl overflow-hidden shadow-lg"
      >
        <div
          className="cursor-grab active:cursor-grabbing px-3 py-2 text-xs font-medium bg-white/10"
          onMouseDown={(e) => {
            e.preventDefault();
            setDrag({ dx: e.clientX, dy: e.clientY });
          }}
        >
          AI Tools
        </div>
        <div className="p-2 grid grid-cols-2 gap-2">
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "generate-architecture" })}
          >
            Generate
          </button>
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "suggest-improvements" })}
          >
            Suggest
          </button>
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "export-png" })}
          >
            Export PNG
          </button>
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "export-svg" })}
          >
            Export SVG
          </button>
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "toggle-grid" })}
          >
            Grid
          </button>
          <button
            className="glass px-3 py-2 text-xs"
            onClick={() => dispatch({ type: "toggle-draw" })}
          >
            Draw
          </button>
        </div>
      </div>
    </div>
  );
}


