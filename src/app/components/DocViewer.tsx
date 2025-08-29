"use client";

import React from "react";

export function DocViewer({ json }: { json: string }) {
  return (
    <div className="glass p-4">
      <pre className="text-xs whitespace-pre-wrap break-words">{json}</pre>
    </div>
  );
}


