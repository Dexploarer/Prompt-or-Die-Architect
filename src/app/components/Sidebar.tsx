"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Plus, Search, Settings, User, MessageCircle } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="space-y-4">
      <div className="glass p-3">
        <Link href="/builder" className="w-full flex items-center gap-2 glass px-3 py-2 rounded-lg">
          <Plus className="w-4 h-4" />
          <span className="text-sm">New Project</span>
        </Link>
        <Link href="#" className="w-full flex items-center gap-2 mt-2 px-3 py-2 rounded-lg hover:bg-white/10">
          <Inbox className="w-4 h-4" />
          <span className="text-sm">Inbox</span>
        </Link>
      </div>

      <div className="glass p-3">
        <div className="text-xs uppercase opacity-70 mb-2">Projects</div>
        <div className="relative">
          <input className="w-full bg-white/5 px-8 py-2 rounded-md outline-none" placeholder="Search projects" />
          <Search className="w-4 h-4 absolute left-2 top-2.5 opacity-70" />
        </div>
        <div className="text-xs opacity-70 mt-4">No projects found</div>
      </div>

      <div className="glass p-3 flex flex-col gap-2">
        <a href="#" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/10">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Join Community</span>
        </a>
        <a href="#" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/10">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </a>
        <a href="#" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/10">
          <User className="w-4 h-4" />
          <span className="text-sm">Profile</span>
        </a>
      </div>
    </aside>
  );
}


