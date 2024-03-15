"use client";
import { useEffect } from "react";

// used after auth flow to close popup window
export default function CloseWindow() {
  useEffect(() => {
    window.close();
  }, []);

  return null;
}
