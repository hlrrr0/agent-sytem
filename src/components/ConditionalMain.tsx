"use client"

import { usePathname } from "next/navigation"

interface ConditionalMainProps {
  children: React.ReactNode
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname()
  
  // 公開ページかどうかを判定
  const isPublicPage = pathname?.startsWith('/public/')
  
  return (
    <main className={isPublicPage ? "" : ""}>
      {children}
    </main>
  )
}