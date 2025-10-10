"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  ArrowLeft, 
  Store, 
  Edit, 
  MapPin, 
  Building2,
  ExternalLink
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store as StoreType, businessTypeLabels, statusLabels } from '@/types/store'
import { Company } from '@/types/company'

interface StoreDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function StoreDetailPage({ params }: StoreDetailPageProps) {
  return (
    <ProtectedRoute>
      <StoreDetailContent params={params} />
    </ProtectedRoute>
  )
}

function StoreDetailContent({ params }: StoreDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string>('')
  const [store, setStore] = useState<StoreType | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      setStoreId(resolvedParams.id)
      
      const fetchStoreData = async () => {
        try {
          const storeDoc = await getDoc(doc(db, 'stores', resolvedParams.id))
          if (storeDoc.exists()) {
            const storeData = storeDoc.data() as StoreType
            setStore({ ...storeData, id: resolvedParams.id })
            
            // 関連会社の情報を取得
            if (storeData.companyId) {
              const companyDoc = await getDoc(doc(db, 'companies', storeData.companyId))
              if (companyDoc.exists()) {
                setCompany({ ...companyDoc.data(), id: storeData.companyId } as Company)
              }
            }
          } else {
            alert('店舗が見つかりません')
            router.push('/stores')
          }
        } catch (error) {
          console.error('店舗データの取得に失敗しました:', error)
          alert('店舗データの取得に失敗しました')
        } finally {
          setLoading(false)
        }
      }

      fetchStoreData()
    }

    initializeComponent()
  }, [params, router])

  const getStatusBadge = (status: StoreType['status']) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
    }
    
    return (
      <Badge className={colors[status]}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const getBusinessTypeBadge = (businessType: StoreType['businessType']) => {
    const colors = {
      kaiten: 'bg-orange-100 text-orange-800',
      counter_alacarte: 'bg-blue-100 text-blue-800',
      counter_omakase: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    }
    
    return (
      <Badge className={colors[businessType]}>
        {businessTypeLabels[businessType]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">店舗が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/stores">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              店舗一覧に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8" />
              {store.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(store.status)}
              {getBusinessTypeBadge(store.businessType)}
            </div>
          </div>
        </div>
        
        <Link href={`/stores/${storeId}/edit`}>
          <Button className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            編集
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本情報 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">店舗名</h3>
                  <p className="text-lg">{store.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">業態</h3>
                  <p className="text-lg">{businessTypeLabels[store.businessType]}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  住所
                </h3>
                <p className="mt-1">{store.address}</p>
              </div>

              {store.website && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    公式サイト
                  </h3>
                  <a 
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline"
                  >
                    {store.website}
                  </a>
                </div>
              )}

              {store.tabelogUrl && (
                <div>
                  <h3 className="font-medium text-gray-700">食べログURL</h3>
                  <a 
                    href={store.tabelogUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline"
                  >
                    {store.tabelogUrl}
                  </a>
                </div>
              )}

              {store.instagramUrl && (
                <div>
                  <h3 className="font-medium text-gray-700">Instagram</h3>
                  <a 
                    href={store.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline"
                  >
                    {store.instagramUrl}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">業態</h3>
                  <p className="mt-1">{businessTypeLabels[store.businessType]}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">ステータス</h3>
                  <p className="mt-1">{statusLabels[store.status]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 管理情報 */}
          <Card>
            <CardHeader>
              <CardTitle>管理情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium">作成日時</h3>
                  <p>{new Date(store.createdAt).toLocaleString('ja-JP')}</p>
                </div>
                <div>
                  <h3 className="font-medium">更新日時</h3>
                  <p>{new Date(store.updatedAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 関連会社 */}
          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  関連会社
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{company.name}</h3>
                    {company.address && (
                      <p className="text-sm text-gray-600 mt-1">{company.address}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/companies/${company.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        会社詳細
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/stores/${storeId}/edit`}>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  店舗情報を編集
                </Button>
              </Link>
              
              <Link href="/jobs/new">
                <Button variant="outline" className="w-full justify-start">
                  <Store className="h-4 w-4 mr-2" />
                  この店舗で求人を作成
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle>統計情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">関連求人数</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">応募者数</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">採用数</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
