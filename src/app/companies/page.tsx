"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  RefreshCw
} from 'lucide-react'
import { Company } from '@/types/company'
import { getCompanies, deleteCompany } from '@/lib/firestore/companies'
import { toast } from 'sonner'

const statusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  prospect: '見込み客',
  prospect_contacted: '見込み客/接触あり',
  appointment: 'アポ',
  no_approach: 'アプローチ不可',
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  prospect_contacted: 'bg-yellow-100 text-yellow-800',
  appointment: 'bg-purple-100 text-purple-800',
  no_approach: 'bg-red-100 text-red-800',
}

const sizeLabels = {
  startup: 'スタートアップ',
  small: '小企業',
  medium: '中企業',
  large: '大企業',
  enterprise: '大企業',
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  
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
      const data = await getCompanies()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('企業データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromDomino = async () => {
    try {
      setIsImporting(true)
      
      // Dominoから企業データを取得（簡易版）
      await new Promise(resolve => setTimeout(resolve, 2000)) // シミュレーション
      
      toast.success('Dominoからのデータ取得が完了しました')
      await loadCompanies() // リロード
    } catch (error) {
      console.error('Error importing from Domino:', error)
      toast.error('Dominoからのインポートに失敗しました')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return

    try {
      await deleteCompany(companyToDelete.id)
      toast.success('企業を削除しました')
      await loadCompanies()
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('企業の削除に失敗しました')
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
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            企業管理
          </h1>
          <p className="text-gray-600 mt-2">
            登録企業の管理・検索・Dominoシステムとの連携
          </p>
        </div>
        
        {/* ヘッダーアクション */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleImportFromDomino}
            disabled={isImporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Dominoから取得
          </Button>
          <Link href="/domino/import">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              詳細インポート
            </Button>
          </Link>
          <Link href="/companies/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規企業追加
            </Button>
          </Link>
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
                  <TableHead>業界</TableHead>
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
                        {company.businessType && company.businessType.length > 0 && (
                          <div className="text-sm text-gray-500">
                            {company.businessType.join(', ')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry || '-'}</TableCell>
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
                        <Link href={`/companies/${company.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCompanyToDelete(company)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  )
}