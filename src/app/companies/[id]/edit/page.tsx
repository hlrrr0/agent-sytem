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
    careerPath: '',
    youngRecruitReason: '',
    hasShokuninUnivRecord: false,
    hasHousingSupport: false,
    fullTimeAgeGroup: '',
    independenceRecord: '',
    hasIndependenceSupport: false,
    contractStartDate: '',
    status: 'active',
    isPublic: true,
    consultantId: '',
    memo: ''
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
              <Label htmlFor="website">会社HP</Label>
              <Input
                id="website"
                type="url"
                value={company.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="address">所在地</Label>
              <Textarea
                id="address"
                value={company.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                placeholder="都道府県、市区町村、番地を入力してください"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeCount">従業員数</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={company.employeeCount || ''}
                  onChange={(e) => handleChange('employeeCount', parseInt(e.target.value) || undefined)}
                  placeholder="従業員数を入力してください"
                />
              </div>

              <div>
                <Label htmlFor="establishedYear">設立年</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={company.establishedYear || ''}
                  onChange={(e) => handleChange('establishedYear', parseInt(e.target.value) || undefined)}
                  placeholder="例: 2010"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 特徴セクション */}
        <Card>
          <CardHeader>
            <CardTitle>特徴セクション</CardTitle>
            <CardDescription>企業の特徴や魅力を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feature1">会社特徴①</Label>
              <Textarea
                id="feature1"
                value={company.feature1 || ''}
                onChange={(e) => handleChange('feature1', e.target.value)}
                rows={3}
                placeholder="地域密着型、アットホームな雰囲気、社員同士の結束が強い など、企業の魅力や特徴を詳しく記載してください"
              />
            </div>

            <div>
              <Label htmlFor="feature2">会社特徴②</Label>
              <Textarea
                id="feature2"
                value={company.feature2 || ''}
                onChange={(e) => handleChange('feature2', e.target.value)}
                rows={3}
                placeholder="研修制度充実、福利厚生充実、キャリアアップ支援 など、従業員へのサポート体制について詳しく記載してください"
              />
            </div>

            <div>
              <Label htmlFor="feature3">会社特徴③</Label>
              <Textarea
                id="feature3"
                value={company.feature3 || ''}
                onChange={(e) => handleChange('feature3', e.target.value)}
                rows={3}
                placeholder="成長企業、安定経営、業界のリーディングカンパニー など、事業面での強みや特徴を詳しく記載してください"
              />
            </div>

            <div>
              <Label htmlFor="careerPath">目指せるキャリア</Label>
              <Textarea
                id="careerPath"
                value={company.careerPath || ''}
                onChange={(e) => handleChange('careerPath', e.target.value)}
                rows={3}
                placeholder="海外就職、海外独立、国内独立、経営層への道筋 など、将来的なキャリアパスについて詳しく記載してください"
              />
            </div>

            <div>
              <Label htmlFor="youngRecruitReason">若手の入社理由</Label>
              <Textarea
                id="youngRecruitReason"
                value={company.youngRecruitReason || ''}
                onChange={(e) => handleChange('youngRecruitReason', e.target.value)}
                rows={3}
                placeholder="若い人材が入社を決める理由や魅力を記載してください"
              />
            </div>
          </CardContent>
        </Card>

        {/* オプションセクション */}
        <Card>
          <CardHeader>
            <CardTitle>オプションセクション</CardTitle>
            <CardDescription>企業の詳細情報や支援制度について</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasShokuninUnivRecord"
                checked={company.hasShokuninUnivRecord ?? false}
                onCheckedChange={(checked) => handleChange('hasShokuninUnivRecord', checked)}
              />
              <Label htmlFor="hasShokuninUnivRecord">飲食人大学就職実績の有無</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasHousingSupport"
                checked={company.hasHousingSupport ?? false}
                onCheckedChange={(checked) => handleChange('hasHousingSupport', checked)}
              />
              <Label htmlFor="hasHousingSupport">寮・家賃保証の有無</Label>
            </div>

            <div>
              <Label htmlFor="fullTimeAgeGroup">正社員年齢層</Label>
              <Input
                id="fullTimeAgeGroup"
                value={company.fullTimeAgeGroup || ''}
                onChange={(e) => handleChange('fullTimeAgeGroup', e.target.value)}
                placeholder="例: 20代中心、30代～40代、幅広い年齢層"
              />
            </div>

            <div>
              <Label htmlFor="independenceRecord">独立実績</Label>
              <Textarea
                id="independenceRecord"
                value={company.independenceRecord || ''}
                onChange={(e) => handleChange('independenceRecord', e.target.value)}
                rows={3}
                placeholder="過去の独立実績や成功事例を記載してください"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasIndependenceSupport"
                checked={company.hasIndependenceSupport ?? false}
                onCheckedChange={(checked) => handleChange('hasIndependenceSupport', checked)}
              />
              <Label htmlFor="hasIndependenceSupport">独立支援の有無</Label>
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
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="memo">メモ</Label>
              <Textarea
                id="memo"
                value={company.memo || ''}
                onChange={(e) => handleChange('memo', e.target.value)}
                rows={4}
                placeholder="企業に関するメモや特記事項を記載してください"
              />
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