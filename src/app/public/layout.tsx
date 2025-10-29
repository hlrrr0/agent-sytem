import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '求人情報 - 人材紹介システム',
  description: '人材紹介サービスの求人情報',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* 公開ページ専用レイアウト - ヘッダーなし */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}