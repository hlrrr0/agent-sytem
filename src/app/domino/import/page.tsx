"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Download, RefreshCw, Settings, Database } from 'lucide-react'
import { toast } from 'sonner'

export default function DominoImportPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <DominoImportPageContent />
    </ProtectedRoute>
  )
}

function DominoImportPageContent() {
  const [importing, setImporting] = useState(false)
  const [settings, setSettings] = useState({
    status: 'active',
    includeJobs: true,
    includeLeads: false,
    includeShops: true,
    limit: 100,
    since: ''
  })

  const handleImport = async () => {
    setImporting(true)
    try {
      // Dominoから企業データを取得（詳細設定版）
      await new Promise(resolve => setTimeout(resolve, 3000)) // シミュレーション
      
      toast.success(`Dominoからのデータインポートが完了しました（設定: ${JSON.stringify(settings)}）`)
    } catch (error) {
      console.error('Error importing from Domino:', error)
      toast.error('Dominoからのインポートに失敗しました')
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
                <h4 className="font-medium">関連データの取得</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeJobs">求人情報も同時取得</Label>
                      <p className="text-sm text-muted-foreground">企業に紐づく求人データも取得します</p>
                    </div>
                    <Switch
                      id="includeJobs"
                      checked={settings.includeJobs}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeJobs: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeShops">店舗情報も同時取得</Label>
                      <p className="text-sm text-muted-foreground">企業に紐づく店舗データも取得します</p>
                    </div>
                    <Switch
                      id="includeShops"
                      checked={settings.includeShops}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeShops: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeLeads">リード情報も同時取得</Label>
                      <p className="text-sm text-muted-foreground">営業情報などのリードデータも取得します</p>
                    </div>
                    <Switch
                      id="includeLeads"
                      checked={settings.includeLeads}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeLeads: checked }))}
                    />
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
      </div>
    </div>
  )
}