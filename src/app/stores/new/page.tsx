"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Store, Save, Loader2 } from 'lucide-react'
import { createStore } from '@/lib/firestore/stores'
import { getCompanies } from '@/lib/firestore/companies'
import { Store as StoreType } from '@/types/store'
import { Company } from '@/types/company'

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    address: '',
    website: '',
    tabelogUrl: '',
    instagramUrl: '',
    status: 'active' as const
  })

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await getCompanies()
        setCompanies(companiesData)
      } catch (error) {
        console.error('企業データの取得に失敗しました:', error)
      }
    }

    fetchCompanies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !formData.name || !formData.address) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      const newStore: Omit<StoreType, 'id'> = {
        companyId: formData.companyId,
        name: formData.name,
        address: formData.address,
        website: formData.website || undefined,
        tabelogUrl: formData.tabelogUrl || undefined,
        instagramUrl: formData.instagramUrl || undefined,
        status: formData.status,
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                店舗の基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyId">所属企業 *</Label>
                <Select value={formData.companyId} onValueChange={(value) => handleChange('companyId', value)}>
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
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例: 寿司松 本店"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">所在地 *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="〒000-0000 東京都..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">営業状況</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">アクティブ</SelectItem>
                    <SelectItem value="inactive">非アクティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* オンライン情報 */}
          <Card>
            <CardHeader>
              <CardTitle>オンライン情報</CardTitle>
              <CardDescription>
                店舗のウェブサイトやSNS情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="website">公式ウェブサイト</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="tabelogUrl">食べログURL</Label>
                <Input
                  id="tabelogUrl"
                  type="url"
                  value={formData.tabelogUrl}
                  onChange={(e) => handleChange('tabelogUrl', e.target.value)}
                  placeholder="https://tabelog.com/..."
                />
              </div>

              <div>
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => handleChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/stores">
            <Button variant="outline" type="button">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                店舗を追加
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
