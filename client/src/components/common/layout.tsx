"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../user/header";
import Footer from "./footer";

const pathsNotToShowHeaders = ["/super-admin"];

function CommonLayout({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, always show header to prevent hydration mismatch
  const showHeader = mounted
    ? !pathsNotToShowHeaders.some((currentPath) =>
        pathName?.startsWith(currentPath)
      )
    : true;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showHeader && <Footer />}
    </div>
  );
}

export default CommonLayout;
