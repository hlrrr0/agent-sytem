"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { Store, businessTypeLabels, statusLabels } from '@/types/store'
import { getStores, deleteStore, getStoresByBusinessType } from '@/lib/firestore/stores'
import { getCompanies } from '@/lib/firestore/companies'
import { Company } from '@/types/company'
import { toast } from 'sonner'

const statusColors = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [businessTypeFilter, setBusinessTypeFilter] = useState<Store['businessType'] | 'all'>('all')
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
      toast.error('データの読み込みに失敗しました')
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
  }

  const getStatusBadge = (status: Store['status']) => {
    return (
      <Badge className={statusColors[status]}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '不明'
  }

  // フィルタリング済み店舗リスト
  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCompanyName(store.companyId).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBusinessType = businessTypeFilter === 'all' || store.businessType === businessTypeFilter
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter
    
    return matchesSearch && matchesBusinessType && matchesStatus
  })

  // 統計データ
  const stats = {
    total: stores.length,
    open: stores.filter(s => s.status === 'open').length,
    closed: stores.filter(s => s.status === 'closed').length,
    kaiten: stores.filter(s => s.businessType === 'kaiten').length,
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
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <StoreIcon className="h-8 w-8" />
            店舗管理
          </h1>
          <p className="text-gray-600 mt-2">
            登録店舗の管理・検索・業態別分析
          </p>
        </div>
        
        {/* ヘッダーアクション */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/companies">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              企業管理に戻る
            </Button>
          </Link>
          <Link href="/stores/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規店舗追加
            </Button>
          </Link>
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
            <CardTitle className="text-sm font-medium">営業中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">閉店</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.closed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">回転寿司</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.kaiten}</div>
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
            
            {/* 業態フィルター */}
            <div>
              <Select value={businessTypeFilter} onValueChange={(value: Store['businessType'] | 'all') => setBusinessTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="業態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての業態</SelectItem>
                  {Object.entries(businessTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead>業態</TableHead>
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
                    <TableCell>
                      <Badge variant="outline">
                        {businessTypeLabels[store.businessType]}
                      </Badge>
                    </TableCell>
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
  )
}