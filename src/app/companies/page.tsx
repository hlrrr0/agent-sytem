"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Building2, 
  Plus, 
  Search, 
  Download,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Upload,
  FileText
} from 'lucide-react'
import { Company } from '@/types/company'
import { getCompanies, deleteCompany } from '@/lib/firestore/companies'
import { importCompaniesFromCSV, generateCompaniesCSVTemplate } from '@/lib/csv/companies'
import { toast } from 'sonner'

const statusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  prospect: '見込み客',
  prospect_contacted: '見込み客/接触あり',
  appointment: 'アポ',
  no_approach: 'アプローチ不可',
  suspended: '停止',
  paused: '休止',
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  prospect_contacted: 'bg-yellow-100 text-yellow-800',
  appointment: 'bg-purple-100 text-purple-800',
  no_approach: 'bg-red-100 text-red-800',
  suspended: 'bg-red-100 text-red-800',
  paused: 'bg-orange-100 text-orange-800',
}

const sizeLabels = {
  startup: 'スタートアップ',
  small: '小企業',
  medium: '中企業',
  large: '大企業',
  enterprise: '大企業',
}

function CompaniesPageContent() {
  const { isAdmin } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [csvImporting, setCsvImporting] = useState(false)
  
  console.log('👤 現在のユーザー権限:', { isAdmin })
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Company['status'] | 'all'>('all')
  const [sizeFilter, setSizeFilter] = useState<Company['size'] | 'all'>('all')
  
  // 削除ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      console.log('📋 企業一覧を読み込み中...')
      const data = await getCompanies()
      console.log(`📊 取得した企業数: ${data.length}`)
      console.log('📝 取得した企業一覧:', data.map(c => ({ id: c.id, name: c.name })))
      setCompanies(data)
    } catch (error) {
      console.error('❌ 企業データの読み込みエラー:', error)
      toast.error('企業データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCSVImport = async (file: File) => {
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('CSVファイルを選択してください')
      return
    }

    setCsvImporting(true)
    try {
      const text = await file.text()
      const result = await importCompaniesFromCSV(text)
      
      if (result.errors.length > 0) {
        toast.error(`インポート完了: 新規${result.success}件、更新${result.updated}件、エラー${result.errors.length}件`)
        console.error('Import errors:', result.errors)
      } else {
        const totalProcessed = result.success + result.updated
        if (result.updated > 0) {
          toast.success(`インポート完了: 新規${result.success}件、更新${result.updated}件（計${totalProcessed}件）`)
        } else {
          toast.success(`${result.success}件の企業データをインポートしました`)
        }
      }
      
      // データを再読み込み
      await loadCompanies()
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('CSVインポートに失敗しました')
    } finally {
      setCsvImporting(false)
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent = generateCompaniesCSVTemplate()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'companies_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteCompany = async () => {
    if (!companyToDelete) {
      console.error('❌ 削除対象の企業が設定されていません')
      toast.error('削除対象の企業が選択されていません')
      return
    }

    console.log('🗑️ 企業削除を開始:', {
      id: companyToDelete.id,
      name: companyToDelete.name
    })

    try {
      await deleteCompany(companyToDelete.id)
      console.log('✅ 企業削除成功:', companyToDelete.name)
      toast.success(`「${companyToDelete.name}」を削除しました`)
      
    } catch (error) {
      console.error('❌ 企業削除エラー:', error)
      toast.error(`「${companyToDelete.name}」の削除に失敗しました: ${error}`)
    } finally {
      // 成功・失敗に関わらず一覧を更新（データ整合性確保）
      console.log('🔄 企業一覧を再読み込み中...')
      try {
        await loadCompanies()
        console.log('🎯 一覧更新完了')
      } catch (reloadError) {
        console.error('❌ 一覧再読み込みエラー:', reloadError)
        toast.error('一覧の更新に失敗しました。ページを再読み込みしてください。')
      }
      
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    }
  }

  const getStatusBadge = (status: Company['status']) => {
    return (
      <Badge className={statusColors[status]}>
        {statusLabels[status]}
      </Badge>
    )
  }

  // フィルタリング済み企業リスト
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter
    const matchesSize = sizeFilter === 'all' || company.size === sizeFilter
    
    return matchesSearch && matchesStatus && matchesSize
  })

  // 統計データ
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    prospects: companies.filter(c => c.status === 'prospect' || c.status === 'prospect_contacted').length,
    appointments: companies.filter(c => c.status === 'appointment').length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">企業データを読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* ページヘッダー - 緑系テーマ */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">企業管理</h1>
              <p className="text-green-100 mt-1">
                登録企業の管理・検索・Dominoシステムとの連携
              </p>
            </div>
          </div>
          
          {/* ヘッダーアクション */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={loadCompanies}
              disabled={loading}
              variant="outline"
              className="bg-white text-green-600 hover:bg-green-50 border-white flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>
            {isAdmin && (
              <Link href="/domino/import">
                <Button 
                  variant="outline"
                  className="bg-white text-green-600 hover:bg-green-50 border-white flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  詳細インポート
                </Button>
              </Link>
            )}
            <Button
              onClick={downloadCSVTemplate}
              variant="outline"
              className="bg-white text-green-600 hover:bg-green-50 border-white flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              CSVテンプレート
            </Button>
            <div className="relative">
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleCSVImport(file)
                    // ファイル選択をリセット
                    e.target.value = ''
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={csvImporting}
              />
              <Button
                variant="outline"
                className="bg-white text-green-600 hover:bg-green-50 border-white flex items-center gap-2"
                disabled={csvImporting}
              >
                {csvImporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                CSVインポート
              </Button>
            </div>
            <Link href="/companies/new">
              <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50 border-white">
                <Plus className="h-4 w-4 mr-2" />
                新規企業追加
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総企業数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">見込み客</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.prospects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">アポ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.appointments}</div>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索 */}
            <div>
              <Input
                placeholder="企業名・メールアドレスで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* ステータスフィルター */}
            <div>
              <Select value={statusFilter} onValueChange={(value: Company['status'] | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 企業規模フィルター */}
            <div>
              <Select value={sizeFilter} onValueChange={(value: Company['size'] | 'all') => setSizeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="企業規模" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての規模</SelectItem>
                  {Object.entries(sizeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 企業リスト */}
      <Card>
        <CardHeader>
          <CardTitle>企業リスト ({filteredCompanies.length}件)</CardTitle>
          <CardDescription>
            登録企業の一覧と管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {companies.length === 0 ? '企業が登録されていません' : '検索条件に一致する企業がありません'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企業名</TableHead>
                  <TableHead>規模</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>Domino</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{company.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sizeLabels[company.size as keyof typeof sizeLabels]}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{company.email}</div>
                        <div className="text-gray-500">{company.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.dominoId ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          連携済み
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          未連携
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/companies/${company.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Link href={`/companies/${company.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('🗑️ 削除ボタンクリック:', {
                                companyId: company.id,
                                companyName: company.name
                              })
                              setCompanyToDelete(company)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {company.website && (
                          <Link href={company.website} target="_blank">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>企業の削除</DialogTitle>
            <DialogDescription>
              「{companyToDelete?.name}」を削除しますか？
              この操作は取り消すことができません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

export default function CompaniesPage() {
  return <CompaniesPageContent />
}