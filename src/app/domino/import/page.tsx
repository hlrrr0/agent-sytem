"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Download } from 'lucide-react'

export default function DominoImportPage() {
  return (
    <ProtectedRoute>
      <DominoImportPageContent />
    </ProtectedRoute>
  )
}

function DominoImportPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Download className="h-8 w-8" />
            Dominoデータインポート
          </h1>
          <p className="text-gray-600 mt-2">
            Dominoシステムからデータを取得
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>データインポート</CardTitle>
          <CardDescription>
            Dominoシステムからの企業データインポート機能（実装中）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Dominoインポート機能は準備中です
          </div>
        </CardContent>
      </Card>
    </div>
  )
}