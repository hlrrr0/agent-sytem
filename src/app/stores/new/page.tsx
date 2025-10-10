"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Store as StoreIcon,
  ArrowLeft,
  Save
} from 'lucide-react'
import { Store, businessTypeLabels, statusLabels } from '@/types/store'
import { Company } from '@/types/company'
import { createStore } from '@/lib/firestore/stores'
import { getCompanies } from '@/lib/firestore/companies'
import { toast } from 'sonner'

function NewStoreForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCompanyId = searchParams?.get('companyId')
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    companyId: preselectedCompanyId || '',
    name: '',
    address: '',
    businessType: 'kaiten' as Store['businessType'],
    website: '',
    tabelogUrl: '',
    instagramUrl: '',
    status: 'open' as Store['status']
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const companiesData = await getCompanies()
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('企業データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId) {
      toast.error('企業を選択してください')
      return
    }
    
    if (!formData.name.trim()) {
      toast.error('店舗名は必須です')
      return
    }

    if (!formData.address.trim()) {
      toast.error('所在地は必須です')
      return
    }

    try {
      setSaving(true)
      const newStoreId = await createStore(formData)
      toast.success('店舗を作成しました')
      router.push(`/stores/${newStoreId}`)
    } catch (error) {
      console.error('Error creating store:', error)
      toast.error('店舗の作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4 mb-8">
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
            新規店舗追加
          </h1>
          <p className="text-gray-600 mt-2">
            新しい店舗の情報を入力してください
          </p>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              店舗の基本情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 企業選択 */}
            <div className="space-y-2">
              <Label htmlFor="companyId">所属企業 *</Label>
              <Select 
                value={formData.companyId} 
                onValueChange={(value) => handleInputChange('companyId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="企業を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 店舗名 */}
            <div className="space-y-2">
              <Label htmlFor="name">店舗名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="寿司職人の店 魚心"
                required
              />
            </div>

            {/* 所在地 */}
            <div className="space-y-2">
              <Label htmlFor="address">所在地 *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="東京都中央区銀座1-1-1"
                required
              />
            </div>

            {/* 業態 */}
            <div className="space-y-2">
              <Label htmlFor="businessType">業態 *</Label>
              <Select 
                value={formData.businessType} 
                onValueChange={(value) => handleInputChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(businessTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 取引状況 */}
            <div className="space-y-2">
              <Label htmlFor="status">取引状況 *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>外部リンク</CardTitle>
            <CardDescription>
              店舗の外部リンク情報を入力してください（任意）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 公式ウェブサイト */}
            <div className="space-y-2">
              <Label htmlFor="website">公式ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* 食べログURL */}
            <div className="space-y-2">
              <Label htmlFor="tabelogUrl">食べログURL</Label>
              <Input
                id="tabelogUrl"
                type="url"
                value={formData.tabelogUrl}
                onChange={(e) => handleInputChange('tabelogUrl', e.target.value)}
                placeholder="https://tabelog.com/..."
              />
            </div>

            {/* Instagram URL */}
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            作成
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewStorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewStoreForm />
    </Suspense>
  )
}