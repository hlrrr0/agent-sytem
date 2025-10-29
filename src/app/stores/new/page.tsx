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

  const handleSubmit = async (formData: Partial<StoreType>) => {

    if (!formData.companyId || !formData.name || !formData.address) {  const searchParams = useSearchParams()

      alert('必須項目を入力してください')

      return  const [loading, setLoading] = useState(false)import { createStore, checkStoreByNameAndCompany, checkStoreByTabelogUrl } from '@/lib/firestore/stores'import { createStore, checkStoreByNameAndCompany, checkStoreByTabelogUrl } from '@/lib/firestore/stores'

    }

  const [initialData, setInitialData] = useState<Partial<StoreType>>({})

    setLoading(true)

import { Store as StoreType } from '@/types/store'import { Store as StoreType } from '@/types/store'

    try {

      // 重複チェック  // URLパラメータから企業IDを取得して初期データを設定

      if (formData.tabelogUrl) {

        const existingStoreByTabelog = await checkStoreByTabelogUrl(formData.tabelogUrl)  useEffect(() => {import StoreForm from '@/components/stores/StoreForm'import StoreForm from '@/components/stores/StoreForm'

        if (existingStoreByTabelog) {

          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)    const companyParam = searchParams.get('company')

          return

        }    if (companyParam) {

      }

      setInitialData({ companyId: companyParam })

      const existingStoreByName = await checkStoreByNameAndCompany(formData.name, formData.companyId)

      if (existingStoreByName) {    }export default function NewStorePage() {export default function NewStorePage() {

        alert(`この企業内に同じ店舗名「${formData.name}」が既に登録されています`)

        return  }, [searchParams])

      }

  const router = useRouter()  const router = useRouter()

      const newStore: Omit<StoreType, 'id'> = {

        companyId: formData.companyId,  const handleSubmit = async (formData: Partial<StoreType>) => {

        name: formData.name,

        address: formData.address,    if (!formData.companyId || !formData.name || !formData.address) {  const searchParams = useSearchParams()  const searchParams = useSearchParams()

        website: formData.website || undefined,

        unitPrice: formData.unitPrice,      alert('必須項目を入力してください')

        seatCount: formData.seatCount,

        isReservationRequired: formData.isReservationRequired || false,      return  const [loading, setLoading] = useState(false)  const [loading, setLoading] = useState(false)

        instagramUrl: formData.instagramUrl || undefined,

        tabelogUrl: formData.tabelogUrl || undefined,    }

        reputation: formData.reputation || undefined,

        staffReview: formData.staffReview || undefined,  const [initialData, setInitialData] = useState<Partial<StoreType>>({})  const [initialData, setInitialData] = useState<Partial<StoreType>>({})

        trainingPeriod: formData.trainingPeriod || undefined,

        ownerPhoto: formData.ownerPhoto || undefined,    setLoading(true)

        ownerVideo: formData.ownerVideo || undefined,

        interiorPhoto: formData.interiorPhoto || undefined,

        status: formData.status || 'active',

        createdAt: new Date(),    try {

        updatedAt: new Date()

      }      // 重複チェック  // URLパラメータから企業IDを取得して初期データを設定  // URLパラメータから企業IDを取得して初期データを設定



      await createStore(newStore)      if (formData.tabelogUrl) {

      alert('店舗が正常に追加されました')

      router.push('/stores')        const existingStoreByTabelog = await checkStoreByTabelogUrl(formData.tabelogUrl)  useEffect(() => {  useEffect(() => {

    } catch (error) {

      console.error('店舗の追加に失敗しました:', error)        if (existingStoreByTabelog) {

      alert('店舗の追加に失敗しました。もう一度お試しください。')

    } finally {          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)    const companyParam = searchParams.get('company')    const companyParam = searchParams.get('company')

      setLoading(false)

    }          return

  }

        }    if (companyParam) {    if (companyParam) {

  return (

    <div className="container mx-auto px-4 py-8">      }

      <div className="flex items-center gap-4 mb-8">

        <Link href="/stores">      setInitialData({ companyId: companyParam })      setInitialData({ companyId: companyParam })

          <Button variant="outline" size="sm">

            <ArrowLeft className="h-4 w-4 mr-2" />      const existingStoreByName = await checkStoreByNameAndCompany(formData.name, formData.companyId)

            戻る

          </Button>      if (existingStoreByName) {    }    }

        </Link>

        <div>        alert(`この企業内に同じ店舗名「${formData.name}」が既に登録されています`)

          <h1 className="text-3xl font-bold flex items-center gap-2">

            <Store className="h-8 w-8" />        return  }, [searchParams])  }, [searchParams])

            新規店舗追加

          </h1>      }

          <p className="text-gray-600 mt-2">

            新しい店舗の情報を入力

          </p>

        </div>      const newStore: Omit<StoreType, 'id'> = {

      </div>

              companyId: formData.companyId,  const handleSubmit = async (formData: Partial<StoreType>) => {  const handleSubmit = async (formData: Partial<StoreType>) => {

      <div className="max-w-4xl">

        <StoreForm         name: formData.name,

          initialData={initialData}

          onSubmit={handleSubmit}        address: formData.address,    if (!formData.companyId || !formData.name || !formData.address) {    if (!formData.companyId || !formData.name || !formData.address) {

          isEdit={false}

          loading={loading}        website: formData.website || undefined,

        />

      </div>        unitPrice: formData.unitPrice,      alert('必須項目を入力してください')      alert('必須項目を入力してください')

    </div>

  )        seatCount: formData.seatCount,

}
        isReservationRequired: formData.isReservationRequired || false,      return      return

        instagramUrl: formData.instagramUrl || undefined,

        tabelogUrl: formData.tabelogUrl || undefined,    }    }

        reputation: formData.reputation || undefined,

        staffReview: formData.staffReview || undefined,

        trainingPeriod: formData.trainingPeriod || undefined,

        ownerPhoto: formData.ownerPhoto || undefined,    setLoading(true)    setLoading(true)

        ownerVideo: formData.ownerVideo || undefined,

        interiorPhoto: formData.interiorPhoto || undefined,

        status: formData.status || 'active',

        createdAt: new Date(),    try {    try {

        updatedAt: new Date()

      }      // 重複チェック      // 重複チェック



      await createStore(newStore)      if (formData.tabelogUrl) {      if (formData.tabelogUrl) {

      alert('店舗が正常に追加されました')

      router.push('/stores')        const existingStoreByTabelog = await checkStoreByTabelogUrl(formData.tabelogUrl)        const existingStoreByTabelog = await checkStoreByTabelogUrl(formData.tabelogUrl)

    } catch (error) {

      console.error('店舗の追加に失敗しました:', error)        if (existingStoreByTabelog) {        if (existingStoreByTabelog) {

      alert('店舗の追加に失敗しました。もう一度お試しください。')

    } finally {          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)

      setLoading(false)

    }          return          return

  }

        }        }

  return (

    <div className="container mx-auto px-4 py-8">      }      }

      <div className="flex items-center gap-4 mb-8">

        <Link href="/stores">

          <Button variant="outline" size="sm">

            <ArrowLeft className="h-4 w-4 mr-2" />      const existingStoreByName = await checkStoreByNameAndCompany(formData.name, formData.companyId)      const existingStoreByName = await checkStoreByNameAndCompany(formData.name, formData.companyId)

            戻る

          </Button>      if (existingStoreByName) {      if (existingStoreByName) {

        </Link>

        <div>        alert(`この企業内に同じ店舗名「${formData.name}」が既に登録されています`)        alert(`この企業内に同じ店舗名「${formData.name}」が既に登録されています`)

          <h1 className="text-3xl font-bold flex items-center gap-2">

            <Store className="h-8 w-8" />        return        return

            新規店舗追加

          </h1>      }      }

          <p className="text-gray-600 mt-2">

            新しい店舗の情報を入力

          </p>

        </div>      const newStore: Omit<StoreType, 'id'> = {      const newStore: Omit<StoreType, 'id'> = {

      </div>

              companyId: formData.companyId,        companyId: formData.companyId,

      <div className="max-w-4xl">

        <StoreForm         name: formData.name,        name: formData.name,

          initialData={initialData}

          onSubmit={handleSubmit}        address: formData.address,        address: formData.address,

          isEdit={false}

          loading={loading}        website: formData.website || undefined,        website: formData.website || undefined,

        />

      </div>        unitPrice: formData.unitPrice,        unitPrice: formData.unitPrice,

    </div>

  )        seatCount: formData.seatCount,        seatCount: formData.seatCount,

}
        isReservationRequired: formData.isReservationRequired || false,        isReservationRequired: formData.isReservationRequired || false,

        instagramUrl: formData.instagramUrl || undefined,        instagramUrl: formData.instagramUrl || undefined,

        tabelogUrl: formData.tabelogUrl || undefined,        tabelogUrl: formData.tabelogUrl || undefined,

        reputation: formData.reputation || undefined,        reputation: formData.reputation || undefined,

        staffReview: formData.staffReview || undefined,        staffReview: formData.staffReview || undefined,

        trainingPeriod: formData.trainingPeriod || undefined,        trainingPeriod: formData.trainingPeriod || undefined,

        ownerPhoto: formData.ownerPhoto || undefined,        ownerPhoto: formData.ownerPhoto || undefined,

        ownerVideo: formData.ownerVideo || undefined,        ownerVideo: formData.ownerVideo || undefined,

        interiorPhoto: formData.interiorPhoto || undefined,        interiorPhoto: formData.interiorPhoto || undefined,

        status: formData.status || 'active',        status: formData.status || 'active',

        createdAt: new Date(),        createdAt: new Date(),

        updatedAt: new Date()        updatedAt: new Date()

      }      }



      await createStore(newStore)      await createStore(newStore)

      alert('店舗が正常に追加されました')      alert('店舗が正常に追加されました')

      router.push('/stores')      router.push('/stores')

    } catch (error) {    } catch (error) {

      console.error('店舗の追加に失敗しました:', error)      console.error('店舗の追加に失敗しました:', error)

      alert('店舗の追加に失敗しました。もう一度お試しください。')      alert('店舗の追加に失敗しました。もう一度お試しください。')

    } finally {    } finally {

      setLoading(false)      setLoading(false)

    }    }

  }  }



  return (  return (

    <div className="container mx-auto px-4 py-8">    <div className="container mx-auto px-4 py-8">

      <div className="flex items-center gap-4 mb-8">      <div className="flex items-center gap-4 mb-8">

        <Link href="/stores">        <Link href="/stores">

          <Button variant="outline" size="sm">          <Button variant="outline" size="sm">

            <ArrowLeft className="h-4 w-4 mr-2" />            <ArrowLeft className="h-4 w-4 mr-2" />

            戻る            戻る

          </Button>          </Button>

        </Link>        </Link>

        <div>        <div>

          <h1 className="text-3xl font-bold flex items-center gap-2">          <h1 className="text-3xl font-bold flex items-center gap-2">

            <Store className="h-8 w-8" />            <Store className="h-8 w-8" />

            新規店舗追加            新規店舗追加

          </h1>          </h1>

          <p className="text-gray-600 mt-2">          <p className="text-gray-600 mt-2">

            新しい店舗の情報を入力            新しい店舗の情報を入力

          </p>          </p>

        </div>        </div>

      </div>      </div>

            

      <div className="max-w-4xl">      <div className="max-w-4xl">

        <StoreForm         <StoreForm 

          initialData={initialData}          initialData={initialData}

          onSubmit={handleSubmit}          onSubmit={handleSubmit}

          isEdit={false}          isEdit={false}

          loading={loading}          loading={loading}

        />        />

      </div>      </div>

    </div>    </div>

  )  )

}}

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

  const handleSubmit = async (formData: Partial<StoreType>) => {
    if (!formData.companyId || !formData.name || !formData.address) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      // 重複チェック
      if (formData.tabelogUrl) {
        const existingStoreByTabelog = await checkStoreByTabelogUrl(formData.tabelogUrl)
        if (existingStoreByTabelog) {
          alert(`この食べログURLは既に登録されています: ${existingStoreByTabelog.name}`)
          return
        }
      }

      const existingStoreByName = await checkStoreByNameAndCompany(formData.name, formData.companyId)
      if (existingStoreByName) {
        alert(`この企業内に同じ店舗名「${formData.name}」が既に登録されています`)
        return
      }

      const newStore: Omit<StoreType, 'id'> = {
        companyId: formData.companyId,
        name: formData.name,
        address: formData.address,
        website: formData.website || undefined,
        unitPrice: formData.unitPrice,
        seatCount: formData.seatCount,
        isReservationRequired: formData.isReservationRequired || false,
        instagramUrl: formData.instagramUrl || undefined,
        tabelogUrl: formData.tabelogUrl || undefined,
        reputation: formData.reputation || undefined,
        staffReview: formData.staffReview || undefined,
        trainingPeriod: formData.trainingPeriod || undefined,
        ownerPhoto: formData.ownerPhoto || undefined,
        ownerVideo: formData.ownerVideo || undefined,
        interiorPhoto: formData.interiorPhoto || undefined,
        status: formData.status || 'active',
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
      
      <div className="max-w-4xl">
        <StoreForm 
          initialData={initialData}
          onSubmit={handleSubmit}
          isEdit={false}
          loading={loading}
        />
      </div>
    </div>
  )
}
