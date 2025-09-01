"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm">Loading...</div>;
  }

  if (session) {
    return (
      <div className="text-sm">
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()} className="glass p-2">Sign out</button>
      </div>
    );
  }

  return (
    <div className="text-sm">
      Not signed in <br />
      <button onClick={() => signIn("github")} className="glass p-2">Sign in with GitHub</button>
    </div>
  );
}
