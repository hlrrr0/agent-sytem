"use client"

import React, { useState, useEffect } from 'react'
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
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Store,
  User
} from 'lucide-react'
import { Company } from '@/types/company'
import { Store as StoreType } from '@/types/store'
import { User as UserType } from '@/types/user'
import { getCompanies, deleteCompany } from '@/lib/firestore/companies'
import { getStoresByCompany } from '@/lib/firestore/stores'
import { getActiveUsers } from '@/lib/firestore/users'
import { importCompaniesFromCSV, generateCompaniesCSVTemplate } from '@/lib/csv/companies'
import { toast } from 'sonner'

const statusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
}

const sizeLabels = {
  startup: '個人店',
  small: '2~3店舗',
  medium: '4~20店舗',
  large: '21~99店舗',
  enterprise: '100店舗以上',
}

function CompaniesPageContent() {
  const { isAdmin } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [csvImporting, setCsvImporting] = useState(false)
  
  // ユーザー一覧
  const [users, setUsers] = useState<UserType[]>([])
  const [userDisplayNameMap, setUserDisplayNameMap] = useState<Record<string, string>>({})
  
  console.log('👤 現在のユーザー権限:', { isAdmin })
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Company['status'] | 'all'>('all')
  const [sizeFilter, setSizeFilter] = useState<Company['size'] | 'all'>('all')
  
  // ソート状態
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'status'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 削除ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  
  // アコーディオンの展開状態と店舗データ
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [companyStores, setCompanyStores] = useState<Record<string, StoreType[]>>({})
  const [loadingStores, setLoadingStores] = useState<Set<string>>(new Set())
  
  // 店舗数キャッシュ
  const [storeCounts, setStoreCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadCompanies()
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('👥 ユーザー一覧を読み込み中...')
      const userData = await getActiveUsers()
      console.log(`📊 取得したユーザー数: ${userData.length}`)
      setUsers(userData)
      
      // ユーザーIDから表示名へのマップを作成
      const displayNameMap = userData.reduce((acc, user) => {
        acc[user.id] = user.displayName
        return acc
      }, {} as Record<string, string>)
      setUserDisplayNameMap(displayNameMap)
      
      console.log('✅ ユーザー表示名マップ作成完了:', displayNameMap)
    } catch (error) {
      console.error('❌ ユーザーデータの読み込みエラー:', error)
      // ユーザーデータの読み込みは必須ではないため、エラートーストは表示しない
    }
  }

  const loadCompanies = async () => {
    try {
      setLoading(true)
      console.log('📋 企業一覧を読み込み中...')
      const data = await getCompanies()
      console.log(`📊 取得した企業数: ${data.length}`)
      console.log('📝 取得した企業一覧:', data.map(c => ({ id: c.id, name: c.name })))
      setCompanies(data)
      
      // 各企業の店舗数を事前に読み込み
      console.log('🏪 店舗数を事前読み込み中...')
      const storeCountPromises = data.map(async (company) => {
        try {
          const stores = await getStoresByCompany(company.id)
          return { companyId: company.id, count: stores.length }
        } catch (error) {
          console.error(`❌ 企業「${company.name}」の店舗数取得エラー:`, error)
          return { companyId: company.id, count: 0 }
        }
      })
      
      const storeCountResults = await Promise.all(storeCountPromises)
      const storeCountsMap = storeCountResults.reduce((acc, { companyId, count }) => {
        acc[companyId] = count
        return acc
      }, {} as Record<string, number>)
      
      setStoreCounts(storeCountsMap)
      console.log('✅ 店舗数キャッシュ完了:', storeCountsMap)
      
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

  // 店舗数を取得して表示するための関数（キャッシュから）
  const getStoreCount = (companyId: string): number => {
    return storeCounts[companyId] ?? 0
  }

  // 担当者の表示名を取得する関数
  const getAssignedToDisplayName = (company: Company): string => {
    // まずassignedToフィールドをチェック（Dominoから来るデータ）
    const assignedTo = (company as any).assignedTo
    if (assignedTo && userDisplayNameMap[assignedTo]) {
      return userDisplayNameMap[assignedTo]
    }
    if (assignedTo && typeof assignedTo === 'string') {
      // ユーザーマップにない場合、assignedToの値をそのまま表示
      return assignedTo
    }
    
    // 次にconsultantIdをチェック
    if (company.consultantId && userDisplayNameMap[company.consultantId]) {
      return userDisplayNameMap[company.consultantId]
    }
    
    return '-'
  }

  // アコーディオンの切り替えと店舗データの読み込み
  const toggleStoreAccordion = async (companyId: string) => {
    const isExpanded = expandedCompanies.has(companyId)
    
    if (isExpanded) {
      // 閉じる
      const newExpanded = new Set(expandedCompanies)
      newExpanded.delete(companyId)
      setExpandedCompanies(newExpanded)
    } else {
      // 展開する
      const newExpanded = new Set(expandedCompanies)
      newExpanded.add(companyId)
      setExpandedCompanies(newExpanded)
      
      // 店舗データがまだ読み込まれていない場合は読み込む
      if (!companyStores[companyId]) {
        setLoadingStores(prev => new Set([...prev, companyId]))
        
        try {
          const stores = await getStoresByCompany(companyId)
          setCompanyStores(prev => ({
            ...prev,
            [companyId]: stores
          }))
        } catch (error) {
          console.error(`店舗データの読み込みに失敗しました (企業ID: ${companyId}):`, error)
          toast.error('店舗データの読み込みに失敗しました')
        } finally {
          setLoadingStores(prev => {
            const newLoading = new Set(prev)
            newLoading.delete(companyId)
            return newLoading
          })
        }
      }
    }
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

  // フィルタリング＆ソート済み企業リスト
  const filteredAndSortedCompanies = companies
    .filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter
      const matchesSize = sizeFilter === 'all' || company.size === sizeFilter
      
      return matchesSearch && matchesStatus && matchesSize
    })
    .sort((a, b) => {
      let valueA: string | Date
      let valueB: string | Date
      
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
          break
        case 'createdAt':
          valueA = new Date(a.createdAt)
          valueB = new Date(b.createdAt)
          break
        case 'updatedAt':
          valueA = new Date(a.updatedAt)
          valueB = new Date(b.updatedAt)
          break
        case 'status':
          valueA = a.status
          valueB = b.status
          break
        default:
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
      }
      
      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })

  // ソート切り替えハンドラー
  const handleSort = (field: 'name' | 'createdAt' | 'updatedAt' | 'status') => {
    if (sortBy === field) {
      // 同じフィールドの場合は昇順・降順を切り替え
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 異なるフィールドの場合は昇順に設定
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // ソートアイコンを取得
  const getSortIcon = (field: 'name' | 'createdAt' | 'updatedAt' | 'status') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  // ソート可能なヘッダーコンポーネント
  const SortableHeader = ({ field, children }: { 
    field: 'name' | 'createdAt' | 'updatedAt' | 'status', 
    children: React.ReactNode 
  }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

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
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
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
          <div className="flex flex-col sm:flex-col gap-2">
            <Button 
              onClick={loadCompanies}
              disabled={loading}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50 border-white flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>

            <Button
              onClick={downloadCSVTemplate}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50 border-white flex items-center gap-2"
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
                className="bg-white text-blue-600 hover:bg-blue-50 border-white flex items-center gap-2"
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
              <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                <Plus className="h-4 w-4 mr-2" />
                新規企業追加
              </Button>
            </Link>
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
                  <SelectItem value="name-asc">企業名（昇順）</SelectItem>
                  <SelectItem value="name-desc">企業名（降順）</SelectItem>
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

      {/* 企業リスト */}
      <Card>
        <CardHeader>
          <CardTitle>企業リスト ({filteredAndSortedCompanies.length}件)</CardTitle>
          <CardDescription>
            登録企業の一覧と管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {companies.length === 0 ? '企業が登録されていません' : '検索条件に一致する企業がありません'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name">企業名</SortableHeader>
                  <SortableHeader field="status">ステータス</SortableHeader>
                  <TableHead>担当者</TableHead>
                  <TableHead>店舗数</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCompanies.map((company) => {
                  const isInactive = company.status === 'inactive'
                  const isExpanded = expandedCompanies.has(company.id)
                  const storeCount = getStoreCount(company.id)
                  const stores = companyStores[company.id] || []
                  const isLoadingStores = loadingStores.has(company.id)
                  
                  return (
                    <React.Fragment key={company.id}>
                      <TableRow 
                        className={isInactive ? 'bg-gray-50' : ''}
                      >
                        <TableCell className="font-medium">
                          <Link href={`/companies/${company.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-semibold">{company.name}</div>
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {getAssignedToDisplayName(company)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleStoreAccordion(company.id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Store className="h-4 w-4" />
                            <span>{storeCount}件</span>
                            {storeCount > 0 && (
                              isExpanded ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                            {isLoadingStores && (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            )}
                          </button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* 店舗一覧のアコーディオン */}
                      {isExpanded && storeCount > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="font-medium mb-3 text-gray-700">店舗一覧 ({storeCount}件)</h4>
                              <div className="grid gap-2">
                                {stores.map((store) => (
                                  <div
                                    key={store.id}
                                    className="bg-white p-3 rounded border border-gray-200 flex justify-between items-start"
                                  >
                                    <div>
                                      <div className="font-medium">{store.name}</div>
                                      <div className="text-sm text-gray-600">
                                        {store.address && <div>📍 {store.address}</div>}
                                        {store.website && <div>🌐 <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{store.website}</a></div>}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Link href={`/stores/${store.id}`}>
                                        <Button variant="outline" size="sm">
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      </Link>
                                      {isAdmin && (
                                        <Link href={`/stores/${store.id}/edit`}>
                                          <Button variant="outline" size="sm">
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
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