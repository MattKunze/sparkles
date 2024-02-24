"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useNavigation } from "@/components/hooks/useNavigation";

export default function EditorPage() {
  const router = useRouter();
  const { resolvePath } = useNavigation();
  useEffect(() => {
    router.replace(resolvePath("/"));
  }, [router, resolvePath]);

  return null;
}
