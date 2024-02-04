"use client";
import { signOut } from "next-auth/react";

import { EnvironmentManager } from "@/components/organisms/EnvironmentManager";

export default function PreferencesPage() {
  return (
    <div className="container py-10 pr-2 flex flex-col gap-5">
      <EnvironmentManager />

      <div className="flex flex-row justify-center">
        <button className="btn btn-primary" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
