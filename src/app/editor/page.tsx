"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditorPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
