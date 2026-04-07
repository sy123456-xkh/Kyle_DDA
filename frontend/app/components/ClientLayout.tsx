"use client"

import { usePathname } from "next/navigation"
import Navigation from "./Navigation"
import { useData } from "../contexts/DataContext"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { datasetId } = useData()

  const activePage: "landing" | "data-hub" | "copilot" =
    pathname.startsWith("/copilot")
      ? "copilot"
      : pathname.startsWith("/data-hub")
        ? "data-hub"
        : "landing"

  const showNav = pathname !== "/"

  return (
    <>
      {showNav && <Navigation activePage={activePage} hasDataset={!!datasetId} />}
      {children}
    </>
  )
}
