import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '求人情報 - 人材紹介システム',
  description: '人材紹介サービスの求人情報',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // デバッグ用：公開レイアウトが使用されていることを確認
  console.log('Public layout is being used - no header should be present')
  
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* 公開ページ専用レイアウト - ヘッダーなし */}
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}