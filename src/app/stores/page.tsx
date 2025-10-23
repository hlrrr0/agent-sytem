"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Store as StoreIcon, 
  Plus, 
  Search, 
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Building2
} from 'lucide-react'
import { Store, statusLabels } from '@/types/store'
import { getStores, deleteStore } from '@/lib/firestore/stores'
import { getCompanies } from '@/lib/firestore/companies'
import { Company } from '@/types/company'

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
  const [stores, setStores] = useState<Store[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Store['status'] | 'all'>('all')

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

  const handleDeleteStore = async (store: Store) => {
    if (confirm(`${store.name}を削除しますか？この操作は取り消せません。`)) {
      try {
        await deleteStore(store.id)
        await loadData()
      } catch (error) {
        console.error('Error deleting store:', error)
        alert('店舗の削除に失敗しました')
      }
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '不明な企業'
  }

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCompanyName(store.companyId).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: stores.length,
    active: stores.filter(s => s.status === 'active').length,
    inactive: stores.filter(s => s.status === 'inactive').length,
  }

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
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総店舗数</CardTitle>
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
            <CardTitle className="text-sm font-medium">非アクティブ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
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
          </div>
        </CardContent>
      </Card>

      {/* 店舗リスト */}
      <Card>
        <CardHeader>
          <CardTitle>店舗リスト ({filteredStores.length}件)</CardTitle>
          <CardDescription>
            登録店舗の一覧と管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {stores.length === 0 ? '店舗が登録されていません' : '検索条件に一致する店舗がありません'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店舗名</TableHead>
                  <TableHead>企業名</TableHead>
                  <TableHead>所在地</TableHead>
                  <TableHead>取引状況</TableHead>
                  <TableHead>外部リンク</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{store.name}</div>
                    </TableCell>
                    <TableCell>{getCompanyName(store.companyId)}</TableCell>
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
