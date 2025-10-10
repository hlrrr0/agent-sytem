"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Store as StoreIcon,
  MapPin,
  Globe,
  Edit,
  ArrowLeft,
  ExternalLink,
  Building2
} from 'lucide-react'
import { Store, businessTypeLabels, statusLabels } from '@/types/store'
import { Company } from '@/types/company'
import { getStoreById } from '@/lib/firestore/stores'
import { getCompanyById } from '@/lib/firestore/companies'
import { toast } from 'sonner'

const statusColors = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
}

export default function StoreDetailPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params?.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) {
        router.push('/stores')
        return
      }

      try {
        setLoading(true)
        const storeData = await getStoreById(storeId)
        
        if (!storeData) {
          toast.error('店舗が見つかりませんでした')
          router.push('/stores')
          return
        }

        setStore(storeData)

        // 企業情報も取得
        const companyData = await getCompanyById(storeData.companyId)
        setCompany(companyData)
      } catch (error) {
        console.error('Error loading store:', error)
        toast.error('店舗データの読み込みに失敗しました')
        router.push('/stores')
      } finally {
        setLoading(false)
      }
    }

    loadStoreData()
  }, [storeId, router])

  const getStatusBadge = (status: Store['status']) => {
    return (
      <Badge className={statusColors[status]}>
        {statusLabels[status]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">店舗データを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!store || !company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">店舗が見つかりませんでした</p>
          <Link href="/stores">
            <Button className="mt-4">
              店舗一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <StoreIcon className="h-8 w-8" />
              {store.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(store.status)}
              <Badge variant="outline">
                {businessTypeLabels[store.businessType]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/stores/${store.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              編集
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 店舗詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">店舗名</label>
                  <p className="text-lg font-semibold">{store.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">業態</label>
                  <p>{businessTypeLabels[store.businessType]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">取引状況</label>
                  <div>{getStatusBadge(store.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  所在地
                </label>
                <p>{store.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* 外部リンク */}
          <Card>
            <CardHeader>
              <CardTitle>外部リンク</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {store.website && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>公式ウェブサイト</span>
                  </div>
                  <Link href={store.website} target="_blank">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      開く
                    </Button>
                  </Link>
                </div>
              )}
              
              {store.tabelogUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>🍽️</span>
                    <span>食べログ</span>
                  </div>
                  <Link href={store.tabelogUrl} target="_blank">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      開く
                    </Button>
                  </Link>
                </div>
              )}
              
              {store.instagramUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>📷</span>
                    <span>Instagram</span>
                  </div>
                  <Link href={store.instagramUrl} target="_blank">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      開く
                    </Button>
                  </Link>
                </div>
              )}
              
              {!store.website && !store.tabelogUrl && !store.instagramUrl && (
                <p className="text-gray-500 text-center py-4">外部リンクが登録されていません</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側: 関連情報 */}
        <div className="space-y-6">
          {/* 所属企業情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                所属企業
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">企業名</label>
                <p className="font-semibold">{company.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">業界</label>
                <p>{company.industry || '未設定'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">企業規模</label>
                <p>{company.size || '未設定'}</p>
              </div>
              <Link href={`/companies/${company.id}`}>
                <Button variant="outline" className="w-full">
                  企業詳細を見る
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/stores/${store.id}/edit`}>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  店舗情報を編集
                </Button>
              </Link>
              <Link href={`/jobs/new?storeId=${store.id}`}>
                <Button className="w-full">
                  この店舗で求人を作成
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle>関連データ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">アクティブな求人</span>
                <span className="font-semibold">0件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">進行中の案件</span>
                <span className="font-semibold">0件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">過去の採用実績</span>
                <span className="font-semibold">0件</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}