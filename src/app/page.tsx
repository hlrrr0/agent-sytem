import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Download,
  Building2,
  Store
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* メインコンテンツ */}
      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              効率的な人材紹介システム
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              求職者と企業を最適にマッチング。Dominoシステムとの連携で、
              より精度の高い人材紹介を実現します。
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/companies">
                <Button size="lg" className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  企業管理
                </Button>
              </Link>
              <Link href="/stores">
                <Button size="lg" variant="outline" className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  店舗管理
                </Button>
              </Link>
              <Link href="/domino/import">
                <Button size="lg" variant="outline" className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Dominoから企業データ取得
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 統計カード */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">アクティブ求職者</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-gray-500">先月比 +12.5%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">登録企業数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">456</div>
                  <p className="text-xs text-gray-500">先月比 +8.3%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">アクティブ求人</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">789</div>
                  <p className="text-xs text-gray-500">先月比 +15.2%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">今月の成約</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-gray-500">先月比 +18.9%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 RecruitPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
