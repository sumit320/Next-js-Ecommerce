"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}

export default RootPage;
