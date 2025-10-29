"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  ArrowLeft, 
  Store, 
  Edit, 
  MapPin, 
  Building2,
  ExternalLink,
  Briefcase,
  X
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store as StoreType, statusLabels } from '@/types/store'
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
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null)

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
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    }
    
    return (
      <Badge className={colors[status]}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const formatDateTime = (date: any) => {
    if (!date) return '未設定'
    
    try {
      let dateObj: Date
      
      // Firestore Timestampの場合
      if (date && typeof date === 'object' && date.toDate) {
        dateObj = date.toDate()
      }
      // Date オブジェクトの場合
      else if (date instanceof Date) {
        dateObj = date
      }
      // 文字列の場合
      else if (typeof date === 'string') {
        dateObj = new Date(date)
      }
      // その他の場合
      else {
        return '未設定'
      }
      
      return dateObj.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('日付フォーマットエラー:', error)
      return '未設定'
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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

              {store.address && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    店舗住所
                  </h3>
                  <p className="mt-1">{store.address}</p>
                </div>
              )}

              {store.nearestStation && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    最寄り駅
                  </h3>
                  <p className="mt-1 whitespace-pre-line">{store.nearestStation}</p>
                </div>
              )}

              {store.website && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    店舗URL
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {store.unitPrice && (
                  <div>
                    <h3 className="font-medium text-gray-700">単価</h3>
                    <p className="mt-1">{store.unitPrice.toLocaleString()}円</p>
                  </div>
                )}
                {store.seatCount && (
                  <div>
                    <h3 className="font-medium text-gray-700">席数</h3>
                    <p className="mt-1">{store.seatCount}席</p>
                  </div>
                )}
                {store.isReservationRequired !== undefined && (
                  <div>
                    <h3 className="font-medium text-gray-700">予約制（時間固定）</h3>
                    <p className="mt-1">{store.isReservationRequired ? 'あり' : 'なし'}</p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* SNS・外部サイト */}
          <Card>
            <CardHeader>
              <CardTitle>SNS・外部サイト</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.instagramUrl && (
                <div>
                  <h3 className="font-medium text-gray-700">Instagram URL</h3>
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
            </CardContent>
          </Card>

          {/* 実績・評価 */}
          {(store.googleReviewScore || store.tabelogScore || store.reputation || store.trainingPeriod) && (
            <Card>
              <CardHeader>
                <CardTitle>実績・評価</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {store.googleReviewScore && (
                  <div>
                    <h3 className="font-medium text-gray-700">Googleの口コミスコア</h3>
                    <p className="mt-2 whitespace-pre-line">{store.googleReviewScore}</p>
                  </div>
                )}
                
                {store.tabelogScore && (
                  <div>
                    <h3 className="font-medium text-gray-700">食べログの口コミスコア</h3>
                    <p className="mt-2 whitespace-pre-line">{store.tabelogScore}</p>
                  </div>
                )}
                
                {store.reputation && (
                  <div>
                    <h3 className="font-medium text-gray-700">その他 / ミシュランなどの獲得状況等の実績</h3>
                    <p className="mt-2 whitespace-pre-line">{store.reputation}</p>
                  </div>
                )}

                {store.trainingPeriod && (
                  <div>
                    <h3 className="font-medium text-gray-700">握れるまでの期間</h3>
                    <p className="mt-2">{store.trainingPeriod}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* スタッフレビュー */}
          {store.staffReview && (
            <Card>
              <CardHeader>
                <CardTitle>スタッフ正直レビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="font-medium text-gray-700">スタッフが食べに行った&quot;正直な&quot;感想</h3>
                  <p className="mt-2 whitespace-pre-line">{store.staffReview}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 素材セクション */}
          {(store.ownerPhoto || store.ownerVideo || store.interiorPhoto || store.photo1 || store.photo2 || store.photo3 || store.photo4 || store.photo5 || store.photo6 || store.photo7) && (
            <Card>
              <CardHeader>
                <CardTitle>素材</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {store.ownerPhoto && (
                  <div className="col-span-1">
                    <h3 className="font-medium text-gray-700 text-sm mb-2">大将の写真</h3>
                    <img 
                      src={store.ownerPhoto} 
                      alt="大将の写真"
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setModalImage({ src: store.ownerPhoto!, alt: '大将の写真' })}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {store.ownerVideo && (
                  <div className="col-span-1">
                    <h3 className="font-medium text-gray-700 text-sm mb-2">大将の動画</h3>
                    <video 
                      controls 
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    >
                      <source src={store.ownerVideo} />
                      動画を再生できません
                    </video>
                  </div>
                )}

                {store.interiorPhoto && (
                  <div className="col-span-1">
                    <h3 className="font-medium text-gray-700 text-sm mb-2">店内の写真</h3>
                    <img 
                      src={store.interiorPhoto} 
                      alt="店内の写真"
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setModalImage({ src: store.interiorPhoto!, alt: '店内の写真' })}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const photoField = `photo${num}` as keyof StoreType
                  const photoUrl = store[photoField] as string
                  if (!photoUrl) return null
                  
                  return (
                    <div key={photoField} className="col-span-1">
                      <h3 className="font-medium text-gray-700 text-sm mb-2">素材写真{num}</h3>
                      <img 
                        src={photoUrl} 
                        alt={`素材写真${num}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setModalImage({ src: photoUrl, alt: `素材写真${num}` })}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )
                })}
                </div>
              </CardContent>
            </Card>
          )}
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
              <Link href={`/jobs/new?company=${store.companyId}&store=${storeId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
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
         {/* 管理情報 */}
          <Card>
            <CardHeader>
              <CardTitle>管理情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium">作成日時</h3>
                  <p>{formatDateTime(store.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-medium">更新日時</h3>
                  <p>{formatDateTime(store.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 画像拡大モーダル */}
      <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              {modalImage?.alt}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalImage(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {modalImage && (
            <div className="p-6 pt-2">
              <img
                src={modalImage.src}
                alt={modalImage.alt}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
