"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Download, RefreshCw, Settings, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { dominoClient, convertDominoCompanyToCompany } from '@/lib/domino-client'
import { createCompany, updateCompany, findCompanyByDominoId } from '@/lib/firestore/companies'
import { Company } from '@/types/company'

export default function DominoImportPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <DominoImportPageContent />
    </ProtectedRoute>
  )
}

function DominoImportPageContent() {
  const [importing, setImporting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [lastImportResult, setLastImportResult] = useState<{
    success: number
    updated: number
    errors: string[]
    timestamp: string
  } | null>(null)
  const [settings, setSettings] = useState({
    status: 'active',
    sizeCategory: 'all',
    prefecture: '',
    limit: 100,
    since: ''
  })

  // コンポーネントマウント時のデバッグ情報
  useEffect(() => {
    console.log('🚀 DominoImportPageContent がマウントされました')
    console.log('🔧 環境変数確認:', {
      NODE_ENV: process.env.NODE_ENV,
      DOMINO_API_URL: process.env.NEXT_PUBLIC_DOMINO_API_URL,
      HAS_API_KEY: !!process.env.NEXT_PUBLIC_DOMINO_API_KEY
    })
  }, [])

  const testConnection = async () => {
    console.log('🔌 接続テストボタンがクリックされました')
    setTestingConnection(true)
    try {
      console.log('🔌 dominoClient.testConnection() を呼び出し中...')
      const result = await dominoClient.testConnection()
      console.log('✅ 接続テスト結果:', result)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('❌ 接続テストエラー:', error)
      toast.error(`接続テストに失敗しました: ${error}`)
    } finally {
      setTestingConnection(false)
      console.log('🔌 接続テスト完了')
    }
  }

  const handleImport = async () => {
    console.log('📥 Dominoインポートを開始します', settings)
    setImporting(true)
    try {
      // Dominoから企業データを取得
      console.log('📡 Dominoクライアントからデータを取得中...')
      const dominoResponse = await dominoClient.getCompanies({
        status: settings.status,
        sizeCategory: settings.sizeCategory,
        limit: settings.limit,
        since: settings.since || undefined
      })

      console.log('📊 Dominoから取得したデータ:', dominoResponse)

      let successCount = 0
      let updatedCount = 0
      const errors: string[] = []

      // 取得したデータをFirestoreに保存
      for (const dominoCompany of dominoResponse.data) {
        try {
          console.log(`🏢 企業「${dominoCompany.name}」を処理中...`)
          
          // DominoCompanyをCompanyに変換
          const companyData = convertDominoCompanyToCompany(dominoCompany)

          // Domino IDで既存企業をチェック
          const existingCompany = await findCompanyByDominoId(dominoCompany.id)
          
          if (existingCompany) {
            // 既存企業を更新
            await updateCompany(existingCompany.id, companyData)
            updatedCount++
            console.log(`✅ 企業「${dominoCompany.name}」を更新しました`)
          } else {
            // 新規企業として作成
            await createCompany(companyData)
            successCount++
            console.log(`🆕 企業「${dominoCompany.name}」を新規作成しました`)
          }
        } catch (error) {
          console.error(`Error processing company ${dominoCompany.name}:`, error)
          errors.push(`企業「${dominoCompany.name}」の処理に失敗: ${error}`)
        }
      }

      const result = {
        success: successCount,
        updated: updatedCount,
        errors,
        timestamp: new Date().toISOString()
      }
      setLastImportResult(result)

      if (errors.length > 0) {
        toast.error(`インポート完了: 新規${successCount}件、更新${updatedCount}件、エラー${errors.length}件`)
      } else {
        const total = successCount + updatedCount
        toast.success(`Dominoから${total}件のデータをインポートしました（新規${successCount}件、更新${updatedCount}件）`)
      }
      
    } catch (error) {
      console.error('Error importing from Domino:', error)
      toast.error(`Dominoからのインポートに失敗しました: ${error}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Dominoからのインポート（管理者限定）</h1>
            <p className="text-muted-foreground">Dominoシステムから企業データを詳細設定で取得します</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 接続テスト */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Domino接続テスト
            </CardTitle>
            <CardDescription>
              まず、Dominoシステムとの接続を確認してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dominoシステムとの接続状況を確認します。開発環境ではモックテストが実行されます。
              </p>
              <Button 
                onClick={testConnection} 
                disabled={testingConnection}
                variant="outline"
                className="min-w-[140px] hover:bg-blue-50 hover:border-blue-300"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    接続確認中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    接続テスト
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* インポート設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              インポート設定
            </CardTitle>
            <CardDescription>
              Dominoシステムからのデータ取得条件を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">企業ステータス</Label>
                  <Select 
                    value={settings.status} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">アクティブのみ</SelectItem>
                      <SelectItem value="inactive">非アクティブのみ</SelectItem>
                      <SelectItem value="all">すべて</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">取得件数上限</Label>
                  <Select 
                    value={settings.limit.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, limit: parseInt(value) }))}
                  >
                    <SelectTrigger id="limit">
                      <SelectValue placeholder="上限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50件</SelectItem>
                      <SelectItem value="100">100件</SelectItem>
                      <SelectItem value="500">500件</SelectItem>
                      <SelectItem value="1000">1000件</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sizeCategory">企業規模でフィルタ</Label>
                <Select value={settings.sizeCategory || 'all'} onValueChange={(value) => setSettings(prev => ({ ...prev, sizeCategory: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="企業規模を選択（全て）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ての企業規模</SelectItem>
                    <SelectItem value="startup">スタートアップ</SelectItem>
                    <SelectItem value="small">小企業</SelectItem>
                    <SelectItem value="medium">中企業</SelectItem>
                    <SelectItem value="large">大企業</SelectItem>
                    <SelectItem value="enterprise">エンタープライズ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県でフィルタ</Label>
                <Input
                  id="prefecture"
                  placeholder="例: 東京都"
                  value={settings.prefecture}
                  onChange={(e) => setSettings(prev => ({ ...prev, prefecture: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="since">更新日時（以降）</Label>
                <Input
                  id="since"
                  type="datetime-local"
                  value={settings.since}
                  onChange={(e) => setSettings(prev => ({ ...prev, since: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">インポート設定</h4>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Dominoシステムから取得したデータは、以下の項目が自動的にマッピングされます：
                  </div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>企業名、企業規模、ステータス</li>
                    <li>求人数、アプローチ数（統計情報）</li>
                    <li>タグ情報（企業特徴として設定）</li>
                    <li>作成日時、更新日時</li>
                  </ul>
                  <div className="text-sm text-yellow-600">
                    ⚠️ 住所・メールアドレスなどの詳細情報は、インポート後に手動で入力してください。
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* インポート実行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              データ取得実行
            </CardTitle>
            <CardDescription>
              上記設定でDominoシステムからデータを取得します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> この操作は既存のデータを上書きする可能性があります。
                  実行前に設定内容をご確認ください。
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="min-w-[140px]"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      取得中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Dominoから取得
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* インポート結果 */}
        {lastImportResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastImportResult.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                最新のインポート結果
              </CardTitle>
              <CardDescription>
                {new Date(lastImportResult.timestamp).toLocaleString('ja-JP')} に実行
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{lastImportResult.success}</div>
                  <div className="text-sm text-green-700">新規作成</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{lastImportResult.updated}</div>
                  <div className="text-sm text-blue-700">更新</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{lastImportResult.errors.length}</div>
                  <div className="text-sm text-red-700">エラー</div>
                </div>
              </div>
              
              {lastImportResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">エラー詳細:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {lastImportResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}