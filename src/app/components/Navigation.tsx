"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: "/", label: "Architecture", icon: "🏗️" },
    { href: "/builder", label: "Stack Builder", icon: "⚙️" },
    { href: "/diagram", label: "Diagram", icon: "📊" },
  ];

  return (
    <nav className="glass p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">Prompt or Die: The Architect</div>
        <div className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-white/20 text-white"
                  : "text-neutral-300 hover:bg-white/10"
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
