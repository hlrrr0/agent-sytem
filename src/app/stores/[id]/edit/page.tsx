"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Store, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store as StoreType } from '@/types/store'
import { Company } from '@/types/company'

interface EditStorePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditStorePage({ params }: EditStorePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string>('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [store, setStore] = useState<Partial<StoreType>>({
    name: '',
    companyId: '',
    address: '',
    businessType: 'kaiten',
    website: '',
    tabelogUrl: '',
    instagramUrl: '',
    status: 'open'
  })

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setStoreId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!storeId) return

    const fetchData = async () => {
      try {
        // 店舗データを取得
        const storeDoc = await getDoc(doc(db, 'stores', storeId))
        if (storeDoc.exists()) {
          const storeData = storeDoc.data() as StoreType
          setStore(storeData)
        } else {
          alert('店舗が見つかりません')
          router.push('/stores')
          return
        }

        // 企業一覧を取得
        const companiesSnapshot = await getDocs(collection(db, 'companies'))
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[]
        setCompanies(companiesData)
        
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
        alert('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [storeId, router])

  const handleChange = (field: keyof StoreType, value: any) => {
    setStore(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return
    setSaving(true)

    try {
      const updatedStore = {
        ...store,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'stores', storeId), updatedStore)
      
      alert('店舗情報を更新しました')
      router.push(`/stores/${storeId}`)
    } catch (error) {
      console.error('店舗更新に失敗しました:', error)
      alert('店舗更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/stores/${storeId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            店舗編集
          </h1>
          <p className="text-gray-600 mt-2">
            店舗情報を編集します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>店舗の基本的な情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">店舗名 *</Label>
                <Input
                  id="name"
                  value={store.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="companyId">所属企業 *</Label>
                <Select 
                  value={store.companyId} 
                  onValueChange={(value) => handleChange('companyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="企業を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">住所 *</Label>
              <Input
                id="address"
                value={store.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">ウェブサイト</Label>
                <Input
                  id="website"
                  type="url"
                  value={store.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="tabelogUrl">食べログURL</Label>
                <Input
                  id="tabelogUrl"
                  type="url"
                  value={store.tabelogUrl}
                  onChange={(e) => handleChange('tabelogUrl', e.target.value)}
                  placeholder="https://tabelog.com/..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={store.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessType">業種</Label>
                <Select 
                  value={store.businessType} 
                  onValueChange={(value) => handleChange('businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kaiten">回転寿司</SelectItem>
                    <SelectItem value="counter_alacarte">カウンター寿司（アラカルト）</SelectItem>
                    <SelectItem value="counter_omakase">カウンター寿司（おまかせ）</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={store.status} 
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">営業中</SelectItem>
                    <SelectItem value="closed">閉店</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '更新中...' : '更新する'}
          </Button>
          
          <Link href={`/stores/${storeId}`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
