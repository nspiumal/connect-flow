"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { initializeThemeListener } from "@/lib/theme";

const App = dynamic(() => import("@/App"), { ssr: false });

export default function CatchAllPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeThemeListener();
  }, []);

  if (!mounted) {
    return null;
  }

  return <App />;
}
