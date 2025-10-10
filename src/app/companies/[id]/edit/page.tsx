"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Building2,
  ArrowLeft,
  Save
} from 'lucide-react'
import { Company } from '@/types/company'
import { getCompanyById, updateCompany } from '@/lib/firestore/companies'
import { toast } from 'sonner'

const companySizes = [
  'startup',
  'small', 
  'medium',
  'large',
  'enterprise'
]

const companyStatuses: Company['status'][] = [
  'active',
  'inactive', 
  'prospect',
  'prospect_contacted',
  'appointment',
  'no_approach'
]

const businessTypes = [
  'カウンター寿司（アラカルト）',
  'カウンター寿司（おまかせ）', 
  '回転寿司',
  '寿司居酒屋',
  'その他'
]

const statusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  prospect: '見込み客',
  prospect_contacted: '見込み客/接触あり',
  appointment: 'アポ',
  no_approach: 'アプローチ不可',
}

const sizeLabels = {
  startup: 'スタートアップ（1-10名）',
  small: '小企業（11-50名）',
  medium: '中企業（51-200名）',
  large: '大企業（201-1000名）',
  enterprise: '大企業（1000名以上）'
}

export default function CompanyEditPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: 'small' as Company['size'],
    phone: '',
    email: '',
    website: '',
    address: '',
    description: '',
    status: 'prospect' as Company['status'],
    businessType: [] as string[]
  })

  // 既存データを読み込み
  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        router.push('/companies')
        return
      }

      try {
        setLoading(true)
        const company = await getCompanyById(companyId)
        
        if (!company) {
          toast.error('企業が見つかりませんでした')
          router.push('/companies')
          return
        }

        setFormData({
          name: company.name,
          industry: company.industry || '',
          size: company.size,
          phone: company.phone,
          email: company.email,
          website: company.website,
          address: company.address,
          description: company.description,
          status: company.status,
          businessType: company.businessType || []
        })
      } catch (error) {
        console.error('Error loading company:', error)
        toast.error('企業データの読み込みに失敗しました')
        router.push('/companies')
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [companyId, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBusinessTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      businessType: checked 
        ? [...prev.businessType, type]
        : prev.businessType.filter(t => t !== type)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('企業名は必須です')
      return
    }

    if (!formData.email.trim()) {
      toast.error('メールアドレスは必須です')
      return
    }

    try {
      setSaving(true)
      await updateCompany(companyId, formData)
      toast.success('企業情報を更新しました')
      router.push(`/companies/${companyId}`)
    } catch (error) {
      console.error('Error updating company:', error)
      toast.error('企業の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">企業データを読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/companies/${companyId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          企業詳細に戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            企業情報編集
          </h1>
          <p className="text-gray-600 mt-2">
            企業情報を編集してください
          </p>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              企業の基本情報を編集してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 企業名 */}
            <div className="space-y-2">
              <Label htmlFor="name">企業名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="株式会社サンプル"
                required
              />
            </div>

            {/* 業界 */}
            <div className="space-y-2">
              <Label htmlFor="industry">業界</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="飲食業"
              />
            </div>

            {/* 企業規模 */}
            <div className="space-y-2">
              <Label htmlFor="size">企業規模 *</Label>
              <Select 
                value={formData.size} 
                onValueChange={(value) => handleInputChange('size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map(size => (
                    <SelectItem key={size} value={size}>
                      {sizeLabels[size as keyof typeof sizeLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ステータス */}
            <div className="space-y-2">
              <Label htmlFor="status">ステータス *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companyStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 業態 */}
            <div className="space-y-2">
              <Label>業態</Label>
              <div className="grid grid-cols-2 gap-2">
                {businessTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.businessType.includes(type)}
                      onCheckedChange={(checked) => 
                        handleBusinessTypeChange(type, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={type}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>連絡先情報</CardTitle>
            <CardDescription>
              企業の連絡先情報を編集してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* メールアドレス */}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@example.com"
                required
              />
            </div>

            {/* 電話番号 */}
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>

            {/* ウェブサイト */}
            <div className="space-y-2">
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* 住所 */}
            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="東京都渋谷区..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>企業説明</CardTitle>
            <CardDescription>
              企業の詳細説明を編集してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="企業の詳細説明を入力してください..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/companies/${companyId}`)}
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
            更新
          </Button>
        </div>
      </form>
    </div>
  )
}