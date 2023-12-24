"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { CommandLine } from "@/components/icons/CommandLine";

export default function UserLinks() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <div className="flex flex-row items-center justify-between p-2">
      <div className="avatar placeholder">
        <div className="bg-neutral text-neutral-content w-10 rounded-full ring ring-transparent hover:ring-primary ring-offset-base-100 ring-offset-2">
          <Link href="/preferences">
            {session.user.image ? (
              <img src={session.user.image} alt={String(session.user.name)} />
            ) : (
              <span>
                {session.user.name
                  ?.split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2) ?? "?"}
              </span>
            )}
          </Link>
        </div>
      </div>
      <Link href="/instances" className="btn-btn-ghost">
        <CommandLine />
      </Link>
    </div>
  );
}
