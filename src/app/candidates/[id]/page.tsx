import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users } from 'lucide-react'

export default function CandidateDetailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/candidates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            求職者詳細
          </h1>
          <p className="text-gray-600 mt-2">
            求職者の詳細情報
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>求職者詳細情報</CardTitle>
          <CardDescription>
            求職者の詳細情報を表示（実装中）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            求職者詳細機能は準備中です
          </div>
        </CardContent>
      </Card>
    </div>
  )
}