"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Building2,
  ArrowLeft,
  Download,
  Upload,
  CheckCircle,
  RefreshCw,
  Search
} from 'lucide-react'
import { Company } from '@/types/company'
import { toast } from 'sonner'

type ImportStatus = 'idle' | 'fetching' | 'reviewing' | 'importing' | 'completed'
type ImportCompany = Company & { selected: boolean; exists: boolean }

export default function DominoImportPage() {
  const router = useRouter()
  
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [companies, setCompanies] = useState<ImportCompany[]>([])
  const [selectedCount, setSelectedCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'existing'>('all')
  
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    skipped: number
  } | null>(null)

  // Dominoから企業データを取得
  const handleFetchFromDomino = async () => {
    try {
      setStatus('fetching')
      
      // Dominoからデータを取得（モック実装）
      await new Promise(resolve => setTimeout(resolve, 2000)) // シミュレーション
      
      const mockCompanies: ImportCompany[] = [
        {
          id: '',
          name: '寿司職人の店 魚心',
          industry: '飲食業',
          size: 'small',
          phone: '03-1234-5678',
          email: 'info@uokoro.co.jp',
          website: 'https://uokoro.co.jp',
          address: '東京都中央区銀座1-1-1',
          description: '伝統的な江戸前寿司を提供する老舗寿司店',
          status: 'prospect',
          businessType: ['カウンター寿司（おまかせ）'],
          dominoId: 'DOM001',
          createdAt: new Date(),
          updatedAt: new Date(),
          selected: true,
          exists: false
        },
        {
          id: '',
          name: '回転寿司 まる銀',
          industry: '飲食業',
          size: 'medium',
          phone: '03-2345-6789',
          email: 'contact@marugin.co.jp',
          website: 'https://marugin.co.jp',
          address: '東京都渋谷区道玄坂2-2-2',
          description: '高品質な回転寿司チェーン店',
          status: 'prospect',
          businessType: ['回転寿司'],
          dominoId: 'DOM002',
          createdAt: new Date(),
          updatedAt: new Date(),
          selected: true,
          exists: true // 既存企業
        },
        {
          id: '',
          name: 'SUSHI BAR TOKYO',
          industry: '飲食業',
          size: 'small',
          phone: '03-3456-7890',
          email: 'hello@sushibar-tokyo.com',
          website: 'https://sushibar-tokyo.com',
          address: '東京都港区六本木3-3-3',
          description: 'モダンな寿司バー',
          status: 'prospect',
          businessType: ['寿司居酒屋'],
          dominoId: 'DOM003',
          createdAt: new Date(),
          updatedAt: new Date(),
          selected: true,
          exists: false
        }
      ]
      
      setCompanies(mockCompanies)
      setSelectedCount(mockCompanies.filter(c => c.selected && !c.exists).length)
      setStatus('reviewing')
      
      toast.success(`${mockCompanies.length}件の企業データを取得しました`)
    } catch (error) {
      console.error('Error fetching from Domino:', error)
      toast.error('Dominoからのデータ取得に失敗しました')
      setStatus('idle')
    }
  }

  // 企業の選択状態を切り替え
  const handleToggleCompany = (index: number) => {
    const updatedCompanies = [...companies]
    updatedCompanies[index].selected = !updatedCompanies[index].selected
    setCompanies(updatedCompanies)
    setSelectedCount(updatedCompanies.filter(c => c.selected && !c.exists).length)
  }

  // 全選択/全解除
  const handleToggleAll = () => {
    const newCompanies = companies.filter(c => !c.exists)
    const allSelected = newCompanies.every(c => c.selected)
    
    const updatedCompanies = companies.map(company => ({
      ...company,
      selected: company.exists ? false : !allSelected
    }))
    
    setCompanies(updatedCompanies)
    setSelectedCount(updatedCompanies.filter(c => c.selected && !c.exists).length)
  }

  // インポート実行
  const handleImport = async () => {
    try {
      setStatus('importing')
      
      const selectedCompanies = companies.filter(c => c.selected && !c.exists)
      
      // 実際のインポート処理（モック）
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const result = {
        success: selectedCompanies.length,
        failed: 0,
        skipped: companies.filter(c => c.exists).length
      }
      
      setImportResult(result)
      setStatus('completed')
      
      toast.success(`${result.success}件の企業をインポートしました`)
    } catch (error) {
      console.error('Error importing companies:', error)
      toast.error('インポートに失敗しました')
      setStatus('reviewing')
    }
  }

  // フィルタリング済み企業リスト
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'new' && !company.exists) ||
                         (filterStatus === 'existing' && company.exists)
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/companies')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          企業一覧に戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Domino企業データインポート
          </h1>
          <p className="text-gray-600 mt-2">
            Dominoシステムから企業データを取得・インポートします
          </p>
        </div>
      </div>

      {/* ステップ1: データ取得 */}
      {status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              ステップ1: Dominoからデータ取得
            </CardTitle>
            <CardDescription>
              Dominoシステムから最新の企業データを取得します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleFetchFromDomino}
              className="flex items-center gap-2"
              size="lg"
            >
              <Download className="h-5 w-5" />
              Dominoからデータを取得
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ローディング */}
      {status === 'fetching' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              データ取得中...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Dominoシステムから企業データを取得しています。</p>
          </CardContent>
        </Card>
      )}

      {/* ステップ2: データ確認・選択 */}
      {status === 'reviewing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ステップ2: インポートデータの確認・選択
              </CardTitle>
              <CardDescription>
                取得したデータを確認し、インポートする企業を選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 統計 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
                  <div className="text-sm text-gray-600">取得済み</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {companies.filter(c => !c.exists).length}
                  </div>
                  <div className="text-sm text-gray-600">新規</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {companies.filter(c => c.exists).length}
                  </div>
                  <div className="text-sm text-gray-600">既存</div>
                </div>
              </div>

              {/* 検索・フィルター */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">検索</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="企業名、メールアドレスで検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="filter">フィルター</Label>
                  <Select value={filterStatus} onValueChange={(value: 'all' | 'new' | 'existing') => setFilterStatus(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="new">新規のみ</SelectItem>
                      <SelectItem value="existing">既存のみ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 一括操作 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleToggleAll}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {companies.filter(c => !c.exists).every(c => c.selected) ? '全解除' : '全選択'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedCount}件選択中
                  </span>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  選択した企業をインポート ({selectedCount})
                </Button>
              </div>

              {/* 企業リスト */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCompanies.map((company) => {
                  const originalIndex = companies.findIndex(c => c.dominoId === company.dominoId)
                  return (
                    <Card key={company.dominoId} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={company.selected}
                            onCheckedChange={() => handleToggleCompany(originalIndex)}
                            disabled={company.exists}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{company.name}</h3>
                              {company.exists ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  既存
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  新規
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>業界: {company.industry}</div>
                              <div>メール: {company.email}</div>
                              <div>電話: {company.phone}</div>
                              {company.businessType.length > 0 && (
                                <div>業態: {company.businessType.join(', ')}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* インポート中 */}
      {status === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              インポート実行中...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">選択した企業をデータベースにインポートしています。</p>
          </CardContent>
        </Card>
      )}

      {/* 完了 */}
      {status === 'completed' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              インポート完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-gray-600">成功</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-gray-600">失敗</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{importResult.skipped}</div>
                  <div className="text-sm text-gray-600">スキップ</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={() => router.push('/companies')}>
                  企業一覧を確認
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setStatus('idle')
                    setCompanies([])
                    setImportResult(null)
                    setSelectedCount(0)
                  }}
                >
                  再度インポート
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}