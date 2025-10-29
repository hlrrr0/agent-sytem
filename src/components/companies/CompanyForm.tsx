"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { Company } from '@/types/company'
import { User } from '@/types/user'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface CompanyFormProps {
  initialData?: Partial<Company>
  onSubmit: (data: Partial<Company>) => Promise<void>
  isEdit?: boolean
  loading?: boolean
}

export default function CompanyForm({ 
  initialData = {}, 
  onSubmit, 
  isEdit = false,
  loading = false 
}: CompanyFormProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    memo: '',
    status: 'active',
    size: 'small',
    isPublic: true,
    consultantId: undefined,
    ...initialData
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: '',
        memo: '',
        status: 'active',
        size: 'small',
        isPublic: true,
        consultantId: undefined,
        ...initialData
      })
    }
  }, [initialData.name, initialData.email, initialData.address, initialData.memo, initialData.status, initialData.consultantId])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'active')
      )
      const usersSnapshot = await getDocs(usersQuery)
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
      
      // roleがuserまたはadminのユーザーのみフィルタリング
      const activeUsers = usersData.filter(user => 
        user.role === 'user' || user.role === 'admin'
      )
      
      setUsers(activeUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleChange = (field: keyof Company, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('企業名は必須項目です')
      return
    }

    try {
      // undefined値を除去してFirestore用にクリーンアップ
      const cleanFormData = { ...formData }
      
      // undefined値を持つフィールドを除去
      Object.keys(cleanFormData).forEach(key => {
        const fieldKey = key as keyof Company
        if (cleanFormData[fieldKey] === undefined) {
          delete cleanFormData[fieldKey]
        }
      })
      
      console.log('送信前のフォームデータ確認:', {
        original: formData,
        cleaned: cleanFormData,
        undefinedFields: Object.keys(formData).filter(key => formData[key as keyof Company] === undefined)
      })
      
      await onSubmit(cleanFormData)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>企業の基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">ステータス *</Label>
            <Select 
              value={formData.status || 'active'} 
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
            <Label htmlFor="name">企業名 *</Label>
            <Input
              id="name"
              value={formData.name ?? ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="株式会社サンプル"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="representative">代表者名</Label>
              <Input
                id="representative"
                value={formData.representative ?? ''}
                onChange={(e) => handleChange('representative', e.target.value)}
                placeholder="田中 太郎"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employeeCount">従業員数</Label>
              <Input
                id="employeeCount"
                type="number"
                value={formData.employeeCount ?? ''}
                onChange={(e) => handleChange('employeeCount', parseInt(e.target.value) || undefined)}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="capital">資本金（万円）</Label>
              <Input
                id="capital"
                type="number"
                value={formData.capital ?? ''}
                onChange={(e) => handleChange('capital', parseInt(e.target.value) || undefined)}
                placeholder="1000"
              />
            </div>

            <div>
              <Label htmlFor="establishedYear">設立年</Label>
              <Input
                id="establishedYear"
                type="number"
                value={formData.establishedYear ?? ''}
                onChange={(e) => handleChange('establishedYear', parseInt(e.target.value) || undefined)}
                placeholder="2000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">ウェブサイト</Label>
            <Input
              id="website"
              type="url"
              value={formData.website ?? ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>

          <div>
            <Label htmlFor="feature1">企業の特徴1</Label>
            <Textarea
              id="feature1"
              value={formData.feature1 ?? ''}
              onChange={(e) => handleChange('feature1', e.target.value)}
              rows={3}
              placeholder="例: 最新技術の積極的な導入"
            />
          </div>

          <div>
            <Label htmlFor="feature2">企業の特徴2</Label>
            <Textarea
              id="feature2"
              value={formData.feature2 ?? ''}
              onChange={(e) => handleChange('feature2', e.target.value)}
              rows={3}
              placeholder="例: 働きやすい環境づくり"
            />
          </div>

          <div>
            <Label htmlFor="feature3">企業の特徴3</Label>
            <Textarea
              id="feature3"
              value={formData.feature3 ?? ''}
              onChange={(e) => handleChange('feature3', e.target.value)}
              rows={3}
              placeholder="例: 社員の成長を重視"
            />
          </div>
        </CardContent>
      </Card>

      {/* 福利厚生情報 */}
      <Card>
        <CardHeader>
          <CardTitle>福利厚生情報</CardTitle>
          <CardDescription>企業の福利厚生や働き方に関する情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHousingSupport"
                checked={formData.hasHousingSupport || false}
                onCheckedChange={(checked) => handleChange('hasHousingSupport', checked)}
              />
              <Label htmlFor="hasHousingSupport">寮・家賃保証の有無</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasIndependenceSupport"
                checked={formData.hasIndependenceSupport || false}
                onCheckedChange={(checked) => handleChange('hasIndependenceSupport', checked)}
              />
              <Label htmlFor="hasIndependenceSupport">独立支援の有無</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="independenceRecord">独立実績</Label>
            <Textarea
              id="independenceRecord"
              value={formData.independenceRecord ?? ''}
              onChange={(e) => handleChange('independenceRecord', e.target.value)}
              rows={3}
              placeholder="例: 過去5年で10名が独立、都内で3店舗、地方で2店舗の開業実績"
            />
          </div>

          <div>
            <Label htmlFor="fullTimeAgeGroup">正社員年齢層</Label>
            <Textarea
              id="fullTimeAgeGroup"
              value={formData.fullTimeAgeGroup ?? ''}
              onChange={(e) => handleChange('fullTimeAgeGroup', e.target.value)}
              rows={2}
              placeholder="例: 20代～40代中心、新卒から50代まで幅広く"
            />
          </div>

          <div>
            <Label htmlFor="careerPath">目指せるキャリア</Label>
            <Textarea
              id="careerPath"
              value={formData.careerPath ?? ''}
              onChange={(e) => handleChange('careerPath', e.target.value)}
              rows={3}
              placeholder="例: 海外就職、海外独立、国内独立、経営層、料理長、店長など"
            />
          </div>

          <div>
            <Label htmlFor="youngRecruitReason">若手の入社理由</Label>
            <Textarea
              id="youngRecruitReason"
              value={formData.youngRecruitReason ?? ''}
              onChange={(e) => handleChange('youngRecruitReason', e.target.value)}
              rows={3}
              placeholder="例: 技術力向上、独立支援制度、海外研修制度、キャリアアップの機会"
            />
          </div>
        </CardContent>
      </Card>

      {/* 連絡先情報 */}
      <Card>
        <CardHeader>
          <CardTitle>連絡先情報</CardTitle>
          <CardDescription>企業の連絡先情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              value={formData.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="〒100-0001 東京都千代田区千代田1-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone ?? ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="size">企業規模</Label>
              <Select 
                value={formData.size || 'small'} 
                onValueChange={(value: 'startup' | 'small' | 'medium' | 'large' | 'enterprise') => handleChange('size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">スタートアップ</SelectItem>
                  <SelectItem value="small">小企業</SelectItem>
                  <SelectItem value="medium">中企業</SelectItem>
                  <SelectItem value="large">大企業</SelectItem>
                  <SelectItem value="enterprise">企業</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={formData.email ?? ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="info@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* メモ・その他 */}
      <Card>
        <CardHeader>
          <CardTitle>メモ・その他</CardTitle>
          <CardDescription>追加情報やメモを入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="consultantId">担当者</Label>
            <Select 
              value={formData.consultantId || 'none'} 
              onValueChange={(value) => handleChange('consultantId', value === 'none' ? undefined : value)}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? "ユーザーを読み込み中..." : "担当者を選択してください"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">担当者を選択しない</SelectItem>
                {users.map((user) => {
                  const displayName = user.displayName || 
                    (user.firstName && user.lastName ? `${user.lastName} ${user.firstName}` : '') ||
                    user.email
                  const roleLabel = user.role === 'admin' ? ' (管理者)' : ''
                  
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {displayName}{roleLabel}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={formData.memo ?? ''}
              onChange={(e) => handleChange('memo', e.target.value)}
              rows={4}
              placeholder="企業に関するメモや特記事項"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic ?? true}
              onCheckedChange={(checked) => handleChange('isPublic', checked)}
            />
            <Label htmlFor="isPublic">公開状態</Label>
          </div>
        </CardContent>
      </Card>

      {/* 送信ボタン */}
      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? '処理中...' : (isEdit ? '更新する' : '作成する')}
        </Button>
      </div>
    </form>
  )
}