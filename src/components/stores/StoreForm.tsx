"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { Store } from '@/types/store'
import { Company } from '@/types/company'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface StoreFormProps {
  initialData?: Partial<Store>
  onSubmit: (data: Partial<Store>) => Promise<void>
  isEdit?: boolean
  loading?: boolean
}

export default function StoreForm({ 
  initialData = {}, 
  onSubmit, 
  isEdit = false,
  loading = false 
}: StoreFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [formData, setFormData] = useState<Partial<Store>>({
    companyId: '',
    name: '',
    address: '',
    website: '',
    unitPrice: undefined,
    seatCount: undefined,
    isReservationRequired: false,
    instagramUrl: '',
    tabelogUrl: '',
    reputation: '',
    staffReview: '',
    trainingPeriod: '',
    ownerPhoto: '',
    ownerVideo: '',
    interiorPhoto: '',
    status: 'active'
  })

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({
        companyId: initialData.companyId || '',
        name: initialData.name || '',
        address: initialData.address || '',
        website: initialData.website || '',
        unitPrice: initialData.unitPrice,
        seatCount: initialData.seatCount,
        isReservationRequired: initialData.isReservationRequired || false,
        instagramUrl: initialData.instagramUrl || '',
        tabelogUrl: initialData.tabelogUrl || '',
        reputation: initialData.reputation || '',
        staffReview: initialData.staffReview || '',
        trainingPeriod: initialData.trainingPeriod || '',
        ownerPhoto: initialData.ownerPhoto || '',
        ownerVideo: initialData.ownerVideo || '',
        interiorPhoto: initialData.interiorPhoto || '',
        status: initialData.status || 'active',
        ...initialData
      })
    }
  }, [initialData])

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true)
      try {
        const companiesQuery = query(
          collection(db, 'companies'),
          where('status', '==', 'active')
        )
        const companiesSnapshot = await getDocs(companiesQuery)
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Company))
        
        setCompanies(companiesData)
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        setLoadingCompanies(false)
      }
    }

    loadCompanies()
  }, [])

  const handleChange = (field: keyof Store, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !formData.name) {
      alert('必須項目を入力してください')
      return
    }

    await onSubmit(formData)
  }

  if (loadingCompanies) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">企業データを読み込み中...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>店舗の基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">店舗ステータス *</Label>
            <Select 
              value={formData.status || 'active'} 
              onValueChange={(value) => handleChange('status', value as 'active' | 'inactive')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">アクティブ</SelectItem>
                <SelectItem value="inactive">閉店/クローズ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="companyId">所属企業 *</Label>
            <Select 
              value={formData.companyId || ''} 
              onValueChange={(value) => handleChange('companyId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="企業を選択してください" />
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
          
          <div>
            <Label htmlFor="name">店舗名 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例: 寿司松 本店"
              required
            />
          </div>


          <div>
            <Label htmlFor="address">店舗住所</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
              placeholder="店舗の住所を入力してください"
            />
          </div>

          <div>
            <Label htmlFor="website">店舗URL</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">単価</Label>
              <Input
                id="unitPrice"
                type="number"
                value={formData.unitPrice || ''}
                onChange={(e) => handleChange('unitPrice', parseInt(e.target.value) || undefined)}
                placeholder="円"
              />
            </div>

            <div>
              <Label htmlFor="seatCount">席数</Label>
              <Input
                id="seatCount"
                type="number"
                value={formData.seatCount || ''}
                onChange={(e) => handleChange('seatCount', parseInt(e.target.value) || undefined)}
                placeholder="席"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isReservationRequired"
              checked={formData.isReservationRequired ?? false}
              onCheckedChange={(checked) => handleChange('isReservationRequired', checked)}
            />
            <Label htmlFor="isReservationRequired">予約制なのか（時間固定の）</Label>
          </div>

          <div>
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              type="url"
              value={formData.instagramUrl || ''}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <Label htmlFor="tabelogUrl">食べログURL</Label>
            <Input
              id="tabelogUrl"
              type="url"
              value={formData.tabelogUrl || ''}
              onChange={(e) => handleChange('tabelogUrl', e.target.value)}
              placeholder="https://tabelog.com/..."
            />
          </div>

          <div>
            <Label htmlFor="reputation">食べログの口コミスコア / ミシュランなどの獲得状況等の実績</Label>
            <Textarea
              id="reputation"
              value={formData.reputation || ''}
              onChange={(e) => handleChange('reputation', e.target.value)}
              rows={3}
              placeholder="食べログスコア、ミシュラン獲得状況、その他の実績を記載してください"
            />
          </div>

          <div>
            <Label htmlFor="staffReview">スタッフが食べに行った&quot;正直な&quot;感想</Label>
            <Textarea
              id="staffReview"
              value={formData.staffReview || ''}
              onChange={(e) => handleChange('staffReview', e.target.value)}
              rows={4}
              placeholder="実際に食べに行ったスタッフの正直な感想を記載してください"
            />
          </div>

          <div>
            <Label htmlFor="trainingPeriod">握れるまでの期間</Label>
            <Input
              id="trainingPeriod"
              value={formData.trainingPeriod || ''}
              onChange={(e) => handleChange('trainingPeriod', e.target.value)}
              placeholder="例: 3ヶ月、半年、1年"
            />
          </div>
        </CardContent>
      </Card>

      {/* 素材セクション */}
      <Card>
        <CardHeader>
          <CardTitle>素材セクション</CardTitle>
          <CardDescription>店舗の写真や動画素材を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ownerPhoto">大将の写真</Label>
            <Input
              id="ownerPhoto"
              type="url"
              value={formData.ownerPhoto || ''}
              onChange={(e) => handleChange('ownerPhoto', e.target.value)}
              placeholder="https://example.com/owner-photo.jpg"
            />
          </div>

          <div>
            <Label htmlFor="ownerVideo">大将の動画</Label>
            <Input
              id="ownerVideo"
              type="url"
              value={formData.ownerVideo || ''}
              onChange={(e) => handleChange('ownerVideo', e.target.value)}
              placeholder="https://example.com/owner-video.mp4"
            />
          </div>

          <div>
            <Label htmlFor="interiorPhoto">店内の写真</Label>
            <Input
              id="interiorPhoto"
              type="url"
              value={formData.interiorPhoto || ''}
              onChange={(e) => handleChange('interiorPhoto', e.target.value)}
              placeholder="https://example.com/interior-photo.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? '更新中...' : '保存中...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? '店舗を更新' : '店舗を追加'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}