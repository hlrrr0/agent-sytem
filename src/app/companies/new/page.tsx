"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Building2, Save, Loader2 } from 'lucide-react'
import { createCompany } from '@/lib/firestore/companies'
import { Company } from '@/types/company'

export default function NewCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    industry: '',
    businessType: '',
    size: 'small' as Company['size'],
    website: '',
    logo: '',
    employeeCount: '',
    capital: '',
    establishedYear: '',
    representative: '',
    feature1: '',
    feature2: '',
    feature3: '',
    contractStartDate: '',
    status: 'active' as const,
    isPublic: true,
    consultantId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.address) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      const newCompany: Omit<Company, 'id'> = {
        name: formData.name,
        address: formData.address,
        email: formData.email || '',
        phone: formData.phone || undefined,
        industry: formData.industry || undefined,
        businessType: formData.businessType ? formData.businessType.split(',').map(s => s.trim()) : undefined,
        size: (formData.size as Company['size']) || 'small',
        website: formData.website || undefined,
        logo: formData.logo || undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        capital: formData.capital ? parseInt(formData.capital) : undefined,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        representative: formData.representative || undefined,
        feature1: formData.feature1 || undefined,
        feature2: formData.feature2 || undefined,
        feature3: formData.feature3 || undefined,
        contractStartDate: formData.contractStartDate || undefined,
        status: formData.status,
        isPublic: formData.isPublic,
        consultantId: formData.consultantId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await createCompany(newCompany)
      alert('企業が正常に追加されました')
      router.push('/companies')
    } catch (error) {
      console.error('企業の追加に失敗しました:', error)
      alert('企業の追加に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'isPublic' ? value === 'true' : value
    }))
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
        <Link href="/companies">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            新規企業追加
          </h1>
          <p className="text-gray-600 mt-2">
            新しい企業の情報を入力
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
                企業の基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">企業名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例: 株式会社サンプル"
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
                <Label htmlFor="representative">代表者名</Label>
                <Input
                  id="representative"
                  value={formData.representative}
                  onChange={(e) => handleChange('representative', e.target.value)}
                  placeholder="田中 太郎"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeCount">従業員数</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => handleChange('employeeCount', e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="establishedYear">設立年</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleChange('establishedYear', e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="capital">資本金（万円）</Label>
                <Input
                  id="capital"
                  type="number"
                  value={formData.capital}
                  onChange={(e) => handleChange('capital', e.target.value)}
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="status">取引状況</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value as 'active' | 'suspended' | 'paused')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">有効</SelectItem>
                    <SelectItem value="suspended">停止</SelectItem>
                    <SelectItem value="paused">休止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 追加情報 */}
          <Card>
            <CardHeader>
              <CardTitle>追加情報</CardTitle>
              <CardDescription>
                企業の特徴や連絡先情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="website">ウェブサイト</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="logo">ロゴ画像URL</Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo}
                  onChange={(e) => handleChange('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="contractStartDate">取引開始日</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => handleChange('contractStartDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="feature1">会社特徴1</Label>
                <Input
                  id="feature1"
                  value={formData.feature1}
                  onChange={(e) => handleChange('feature1', e.target.value)}
                  placeholder="例: 地域密着型"
                />
              </div>

              <div>
                <Label htmlFor="feature2">会社特徴2</Label>
                <Input
                  id="feature2"
                  value={formData.feature2}
                  onChange={(e) => handleChange('feature2', e.target.value)}
                  placeholder="例: 研修制度充実"
                />
              </div>

              <div>
                <Label htmlFor="feature3">会社特徴3</Label>
                <Input
                  id="feature3"
                  value={formData.feature3}
                  onChange={(e) => handleChange('feature3', e.target.value)}
                  placeholder="例: 成長企業"
                />
              </div>

              <div>
                <Label htmlFor="consultantId">担当コンサルタントID</Label>
                <Input
                  id="consultantId"
                  value={formData.consultantId}
                  onChange={(e) => handleChange('consultantId', e.target.value)}
                  placeholder="CONS001"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleChange('isPublic', checked.toString())}
                />
                <Label htmlFor="isPublic">企業情報を公開する</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/companies">
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
                企業を追加
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </ProtectedRoute>
  )
}