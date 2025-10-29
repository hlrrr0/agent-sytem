"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Store } from 'lucide-react'
import { createStore, checkStoreByNameAndCompany, checkStoreByTabelogUrl } from '@/lib/firestore/stores'
import { Store as StoreType } from '@/types/store'
import StoreForm from '@/components/stores/StoreForm'

export default function NewStorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<Partial<StoreType>>({})

  // URLパラメータから企業IDを取得して初期データを設定
  useEffect(() => {
    const companyParam = searchParams.get('company')
    if (companyParam) {
      setInitialData({ companyId: companyParam })
    }
  }, [searchParams])

  const handleSubmit = async (data: Partial<StoreType>) => {
    if (!data.companyId || !data.name || !data.address) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      // 重複チェック
      if (data.tabelogUrl) {
        const existingStoreByTabelog = await checkStoreByTabelogUrl(data.tabelogUrl)
        if (existingStoreByTabelog) {
          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)
          return
        }
      }

      const existingStoreByName = await checkStoreByNameAndCompany(data.name, data.companyId)
      if (existingStoreByName) {
        alert(`この企業内に同じ店舗名「${data.name}」が既に登録されています`)
        return
      }

      const newStore: Omit<StoreType, 'id'> = {
        companyId: data.companyId,
        name: data.name,
        address: data.address || '',
        website: data.website,
        unitPrice: data.unitPrice,
        seatCount: data.seatCount,
        isReservationRequired: data.isReservationRequired || false,
        instagramUrl: data.instagramUrl,
        tabelogUrl: data.tabelogUrl,
        reputation: data.reputation,
        staffReview: data.staffReview,
        trainingPeriod: data.trainingPeriod,
        ownerPhoto: data.ownerPhoto,
        ownerVideo: data.ownerVideo,
        interiorPhoto: data.interiorPhoto,
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await createStore(newStore)
      alert('店舗が正常に追加されました')
      router.push('/stores')
    } catch (error) {
      console.error('店舗の追加に失敗しました:', error)
      alert('店舗の追加に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/stores">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            新規店舗追加
          </h1>
          <p className="text-gray-600 mt-2">
            新しい店舗の情報を入力
          </p>
        </div>
      </div>
      
      <StoreForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}