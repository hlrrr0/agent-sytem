"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types/company'
import { User } from '@/types/user'

interface EditCompanyPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [company, setCompany] = useState<Partial<Company>>({
    name: '',
    address: '',
    employeeCount: 0,
    capital: 0,
    establishedYear: new Date().getFullYear(),
    representative: '',
    website: '',
    logo: '',
    feature1: '',
    feature2: '',
    feature3: '',
    contractStartDate: '',
    status: 'active',
    isPublic: true,
    consultantId: ''
  })

  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      setCompanyId(resolvedParams.id)
      
      const fetchCompany = async () => {
        try {
          // ユーザー一覧の取得
          const usersQuery = query(
            collection(db, 'users'),
            where('role', '!=', 'rejected')
          )
          const usersSnapshot = await getDocs(usersQuery)
          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[]
          setUsers(usersData)

          // 企業データの取得
          const companyDoc = await getDoc(doc(db, 'companies', resolvedParams.id))
          if (companyDoc.exists()) {
            const companyData = companyDoc.data() as Company
            setCompany(companyData)
          } else {
            alert('企業が見つかりません')
            router.push('/companies')
          }
        } catch (error) {
          console.error('企業データの取得に失敗しました:', error)
          alert('企業データの取得に失敗しました')
        } finally {
          setLoading(false)
        }
      }

      fetchCompany()
    }

    initializeComponent()
  }, [params, router])

  const handleChange = (field: keyof Company, value: any) => {
    setCompany(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedCompany = {
        ...company,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'companies', companyId), updatedCompany)
      
      alert('企業情報を更新しました')
      router.push(`/companies/${companyId}`)
    } catch (error) {
      console.error('企業更新に失敗しました:', error)
      alert('企業更新に失敗しました')
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
        <Link href={`/companies/${companyId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            企業編集
          </h1>
          <p className="text-gray-600 mt-2">
            企業情報を編集します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>企業の基本的な情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">企業名 *</Label>
              <Input
                id="name"
                value={company.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="address">所在地 *</Label>
              <Textarea
                id="address"
                value={company.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="representative">代表者名</Label>
              <Input
                id="representative"
                value={company.representative || ''}
                onChange={(e) => handleChange('representative', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employeeCount">従業員数</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={company.employeeCount || 0}
                  onChange={(e) => handleChange('employeeCount', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="capital">資本金（万円）</Label>
                <Input
                  id="capital"
                  type="number"
                  value={company.capital || 0}
                  onChange={(e) => handleChange('capital', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="establishedYear">設立年</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={company.establishedYear || new Date().getFullYear()}
                  onChange={(e) => handleChange('establishedYear', parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 連絡先・特徴情報 */}
        <Card>
          <CardHeader>
            <CardTitle>連絡先・特徴情報</CardTitle>
            <CardDescription>企業の連絡先と特徴を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={company.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="logo">ロゴ画像URL</Label>
              <Input
                id="logo"
                type="url"
                value={company.logo || ''}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="feature1">会社特徴1</Label>
              <Input
                id="feature1"
                value={company.feature1 || ''}
                onChange={(e) => handleChange('feature1', e.target.value)}
                placeholder="例: 地域密着型"
              />
            </div>

            <div>
              <Label htmlFor="feature2">会社特徴2</Label>
              <Input
                id="feature2"
                value={company.feature2 || ''}
                onChange={(e) => handleChange('feature2', e.target.value)}
                placeholder="例: 研修制度充実"
              />
            </div>

            <div>
              <Label htmlFor="feature3">会社特徴3</Label>
              <Input
                id="feature3"
                value={company.feature3 || ''}
                onChange={(e) => handleChange('feature3', e.target.value)}
                placeholder="例: 成長企業"
              />
            </div>
          </CardContent>
        </Card>

        {/* 取引・管理情報 */}
        <Card>
          <CardHeader>
            <CardTitle>取引・管理情報</CardTitle>
            <CardDescription>取引状況と担当者情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contractStartDate">取引開始日</Label>
              <Input
                id="contractStartDate"
                type="date"
                value={typeof company.contractStartDate === 'string' ? company.contractStartDate.split('T')[0] : ''}
                onChange={(e) => handleChange('contractStartDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="consultantId">担当コンサルタント</Label>
              <Select 
                value={company.consultantId || ''} 
                onValueChange={(value) => handleChange('consultantId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="担当コンサルタントを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">担当者なし</SelectItem>
                  {users
                    .filter(user => user.status === 'active' && (user.role === 'admin' || user.role === 'user'))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName || user.email} ({user.role === 'admin' ? '管理者' : 'ユーザー'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">取引状況</Label>
              <Select 
                value={company.status || 'active'} 
                onValueChange={(value) => handleChange('status', value)}
              >
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

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={company.isPublic ?? true}
                onCheckedChange={(checked) => handleChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic">企業情報を公開する</Label>
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
          
          <Link href={`/companies/${companyId}`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}