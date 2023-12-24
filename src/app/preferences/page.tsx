"use client";
import { signOut } from "next-auth/react";

export default function PreferencesPage() {
  return (
    <div className="container py-10 flex flex-col gap-5">
      <p>Not much to show here yet...</p>
      <div className="flex flex-row justify-center">
        <button className="btn btn-primary" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
