"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Store as StoreIcon, 
  Plus, 
  Search, 
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Building2,
  Download,
  Upload,
  FileText
} from 'lucide-react'
import { Store, statusLabels } from '@/types/store'
import { getStores, deleteStore } from '@/lib/firestore/stores'
import { getCompanies } from '@/lib/firestore/companies'
import { Company } from '@/types/company'
import { importStoresFromCSV, generateStoresCSVTemplate } from '@/lib/csv/stores'
import { toast } from 'sonner'

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
}

export default function StoresPage() {
  return (
    <ProtectedRoute>
      <StoresPageContent />
    </ProtectedRoute>
  )
}

function StoresPageContent() {
  const { isAdmin } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [csvImporting, setCsvImporting] = useState(false)
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Store['status'] | 'all'>('all')
  
  // ソート状態
  const [sortBy, setSortBy] = useState<'name' | 'companyName' | 'createdAt' | 'updatedAt' | 'status'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 複数選択・削除状態
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [storesData, companiesData] = await Promise.all([
        getStores(),
        getCompanies()
      ])
      setStores(storesData)
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error loading data:', error)
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
      const result = await importStoresFromCSV(text)
      
      if (result.errors.length > 0) {
        toast.error(`インポート完了: 新規${result.success}件、更新${result.updated}件、エラー${result.errors.length}件`)
        console.error('Import errors:', result.errors)
      } else {
        const totalProcessed = result.success + result.updated
        if (result.updated > 0) {
          toast.success(`インポート完了: 新規${result.success}件、更新${result.updated}件（計${totalProcessed}件）`)
        } else {
          toast.success(`${result.success}件の店舗データをインポートしました`)
        }
      }
      
      // データを再読み込み
      await loadData()
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('CSVインポートに失敗しました')
    } finally {
      setCsvImporting(false)
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent = generateStoresCSVTemplate()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'stores_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteStore = async (store: Store) => {
    if (confirm(`${store.name}を削除しますか？この操作は取り消せません。`)) {
      try {
        await deleteStore(store.id)
        await loadData()
      } catch (error) {
        console.error('店舗の削除に失敗しました:', error)
        alert('店舗の削除に失敗しました。')
      }
    }
  }

  // 複数選択機能
  const handleSelectStore = (storeId: string, checked: boolean) => {
    if (checked) {
      setSelectedStores(prev => [...prev, storeId])
    } else {
      setSelectedStores(prev => prev.filter(id => id !== storeId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStores(filteredAndSortedStores.map(store => store.id))
    } else {
      setSelectedStores([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStores.length === 0) {
      alert('削除する店舗を選択してください。')
      return
    }

    const confirmMessage = `選択した${selectedStores.length}件の店舗を削除しますか？この操作は取り消せません。`
    if (!confirm(confirmMessage)) {
      return
    }

    setBulkDeleting(true)
    try {
      const deletePromises = selectedStores.map(storeId => deleteStore(storeId))
      await Promise.all(deletePromises)
      
      setSelectedStores([])
      await loadData()
      alert(`${selectedStores.length}件の店舗を削除しました。`)
    } catch (error) {
      console.error('一括削除中にエラー:', error)
      alert('一部の店舗の削除に失敗しました。')
    } finally {
      setBulkDeleting(false)
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '不明な企業'
  }

  const filteredAndSortedStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCompanyName(store.companyId).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter

    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'companyName':
        aValue = getCompanyName(a.companyId).toLowerCase()
        bValue = getCompanyName(b.companyId).toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const getStatusBadge = (status: Store['status']) => {
    const color = statusColors[status] || 'bg-gray-100 text-gray-800'
    return (
      <Badge className={color}>
        {statusLabels[status]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">店舗データを読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー - オレンジ系テーマ */}
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <StoreIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">店舗管理</h1>
              <p className="text-orange-100 mt-1">
                登録店舗の管理・検索・業態別分析
              </p>
            </div>
          </div>
          
          {/* ヘッダーアクション */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={downloadCSVTemplate}
              variant="outline"
              className="bg-white text-orange-600 hover:bg-orange-50 border-white flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              CSVテンプレート
            </Button>
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button
                variant="outline"
                className="bg-white text-orange-600 hover:bg-orange-50 border-white flex items-center gap-2"
                disabled={csvImporting}
                asChild
              >
                <span>
                  {csvImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      インポート中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      CSVインポート
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleCSVImport(file)
                  e.target.value = '' // リセット
                }
              }}
            />
            <Link href="/companies">
              <Button 
                variant="outline"
                className="bg-white text-orange-600 hover:bg-orange-50 border-white flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                企業管理へ
              </Button>
            </Link>
            <Link href="/stores/new">
              <Button variant="outline" className="bg-white text-orange-600 hover:bg-orange-50 border-white">
                <Plus className="h-4 w-4 mr-2" />
                新規店舗追加
              </Button>
            </Link>
            {isAdmin && selectedStores.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    削除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    選択した{selectedStores.length}件を削除
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            検索・フィルター・ソート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 検索 */}
            <div>
              <Input
                placeholder="店舗名・企業名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* ステータスフィルター */}
            <div>
              <Select value={statusFilter} onValueChange={(value: Store['status'] | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="取引状況" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての状況</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* ソート選択 */}
            <div>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder]
                setSortBy(field)
                setSortOrder(order)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="並び順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">店舗名（昇順）</SelectItem>
                  <SelectItem value="name-desc">店舗名（降順）</SelectItem>
                  <SelectItem value="companyName-asc">企業名（昇順）</SelectItem>
                  <SelectItem value="companyName-desc">企業名（降順）</SelectItem>
                  <SelectItem value="status-asc">ステータス（昇順）</SelectItem>
                  <SelectItem value="status-desc">ステータス（降順）</SelectItem>
                  <SelectItem value="createdAt-desc">登録日（新しい順）</SelectItem>
                  <SelectItem value="createdAt-asc">登録日（古い順）</SelectItem>
                  <SelectItem value="updatedAt-desc">更新日（新しい順）</SelectItem>
                  <SelectItem value="updatedAt-asc">更新日（古い順）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 店舗リスト */}
      <Card>
        <CardHeader>
          <CardTitle>店舗リスト ({filteredAndSortedStores.length}件)</CardTitle>
          <CardDescription>
            登録店舗の一覧と管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedStores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {stores.length === 0 ? '店舗が登録されていません' : '検索条件に一致する店舗がありません'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStores.length === filteredAndSortedStores.length && filteredAndSortedStores.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>店舗名</TableHead>
                  <TableHead>企業名</TableHead>
                  <TableHead>所在地</TableHead>
                  <TableHead>取引状況</TableHead>
                  <TableHead>外部リンク</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedStores.map((store: Store) => (
                  <TableRow key={store.id}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedStores.includes(store.id)}
                          onCheckedChange={(checked) => handleSelectStore(store.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="font-semibold">{store.name}</div>
                    </TableCell>
                    <TableCell>{getCompanyName(store.companyId) ? (
                      <Link 
                        href={`/companies/${store.companyId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {getCompanyName(store.companyId)}
                      </Link>
                    ) : (
                      <span className="text-gray-500">企業情報なし</span>
                    )}</TableCell>
                    <TableCell className="max-w-xs truncate">{store.address}</TableCell>
                    <TableCell>{getStatusBadge(store.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {store.website && (
                          <Link href={store.website} target="_blank">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                        {store.tabelogUrl && (
                          <Link href={store.tabelogUrl} target="_blank">
                            <Button variant="outline" size="sm" className="text-orange-600">
                              🍽️
                            </Button>
                          </Link>
                        )}
                        {store.instagramUrl && (
                          <Link href={store.instagramUrl} target="_blank">
                            <Button variant="outline" size="sm" className="text-pink-600">
                              📷
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/stores/${store.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/stores/${store.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStore(store)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
