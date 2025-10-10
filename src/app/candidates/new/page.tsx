"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  UserPlus,
  ArrowLeft,
  Save,
  Plus,
  Trash2
} from 'lucide-react'
import { Candidate } from '@/types/candidate'
import { createCandidate } from '@/lib/firestore/candidates'
import { toast } from 'sonner'

export default function NewCandidatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    // 基本情報
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    
    // 飲食人大学情報
    enrollmentMonth: '',
    campus: '',
    
    // 職歴（簡易版）
    currentPosition: '',
    currentCompany: '',
    experienceYears: '',
    
    // スキル
    skills: [''],
    
    // 希望条件
    preferredLocations: [''],
    minSalary: '',
    maxSalary: '',
    workStyles: [''],
    
    // ステータス
    status: 'active' as Candidate['status'],
    
    // コメント
    consultantComment: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[]
      return {
        ...prev,
        [field]: currentArray.map((item: string, i: number) => 
          i === index ? value : item
        )
      }
    })
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[]
      return {
        ...prev,
        [field]: [...currentArray, '']
      }
    })
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[]
      return {
        ...prev,
        [field]: currentArray.filter((_: string, i: number) => i !== index)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!formData.firstName.trim()) {
      toast.error('名は必須です')
      return
    }
    
    if (!formData.lastName.trim()) {
      toast.error('姓は必須です')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('メールアドレスは必須です')
      return
    }

    try {
      setSaving(true)
      
      // データ変換
      const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        firstNameKana: formData.firstNameKana,
        lastNameKana: formData.lastNameKana,
        email: formData.email,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        enrollmentMonth: formData.enrollmentMonth || undefined,
        campus: formData.campus || undefined,
        
        // 職歴（現在の職歴から生成）
        experience: formData.currentCompany ? [{
          id: '1',
          company: formData.currentCompany,
          position: formData.currentPosition,
          startDate: new Date(new Date().getFullYear() - parseInt(formData.experienceYears || '0'), 0, 1),
          isCurrent: true,
          description: ''
        }] : [],
        
        // 学歴（空）
        education: [],
        
        // スキル
        skills: formData.skills.filter(skill => skill.trim() !== ''),
        certifications: [],
        
        // 希望条件
        preferences: {
          workLocation: formData.preferredLocations.filter(loc => loc.trim() !== ''),
          salary: {
            min: formData.minSalary ? parseInt(formData.minSalary) : undefined,
            max: formData.maxSalary ? parseInt(formData.maxSalary) : undefined
          },
          workStyle: formData.workStyles.filter(style => style.trim() !== '')
        },
        
        // その他
        consultantComment: formData.consultantComment || undefined,
        status: formData.status,
        notes: formData.notes || undefined
      }
      
      const newCandidateId = await createCandidate(candidateData)
      toast.success('求職者を登録しました')
      router.push(`/candidates/${newCandidateId}`)
    } catch (error) {
      console.error('Error creating candidate:', error)
      toast.error('求職者の登録に失敗しました')
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
            <UserPlus className="h-8 w-8" />
            新規求職者登録
          </h1>
          <p className="text-gray-600 mt-2">
            新しい求職者の情報を入力してください
          </p>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* 基本情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              求職者の基本情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">姓 *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="田中"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">名 *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="太郎"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastNameKana">姓（カナ）</Label>
                <Input
                  id="lastNameKana"
                  value={formData.lastNameKana}
                  onChange={(e) => handleInputChange('lastNameKana', e.target.value)}
                  placeholder="タナカ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstNameKana">名（カナ）</Label>
                <Input
                  id="firstNameKana"
                  value={formData.firstNameKana}
                  onChange={(e) => handleInputChange('firstNameKana', e.target.value)}
                  placeholder="タロウ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="090-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                    <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 飲食人大学情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>飲食人大学情報</CardTitle>
            <CardDescription>
              飲食人大学での情報を入力してください（該当する場合）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentMonth">入学月</Label>
                <Input
                  id="enrollmentMonth"
                  value={formData.enrollmentMonth}
                  onChange={(e) => handleInputChange('enrollmentMonth', e.target.value)}
                  placeholder="2024年4月"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campus">入学校舎</Label>
                <Input
                  id="campus"
                  value={formData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  placeholder="東京校"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 現在の職歴情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>現在の職歴</CardTitle>
            <CardDescription>
              現在の職歴情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentCompany">現在の勤務先</Label>
                <Input
                  id="currentCompany"
                  value={formData.currentCompany}
                  onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                  placeholder="株式会社○○"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentPosition">現在の職種</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                  placeholder="寿司職人"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experienceYears">経験年数</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スキル */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>スキル</CardTitle>
            <CardDescription>
              保有しているスキルを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={skill}
                  onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                  placeholder="寿司握り、接客、英語など"
                  className="flex-1"
                />
                {formData.skills.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('skills', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('skills')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              スキルを追加
            </Button>
          </CardContent>
        </Card>

        {/* 希望条件 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>希望条件</CardTitle>
            <CardDescription>
              求職者の希望条件を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 希望勤務地 */}
            <div className="space-y-2">
              <Label>希望勤務地</Label>
              {formData.preferredLocations.map((location, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={location}
                    onChange={(e) => handleArrayChange('preferredLocations', index, e.target.value)}
                    placeholder="東京都、神奈川県など"
                    className="flex-1"
                  />
                  {formData.preferredLocations.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('preferredLocations', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('preferredLocations')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                勤務地を追加
              </Button>
            </div>

            {/* 希望給与 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSalary">最低希望給与（円）</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={formData.minSalary}
                  onChange={(e) => handleInputChange('minSalary', e.target.value)}
                  placeholder="250000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxSalary">最高希望給与（円）</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={formData.maxSalary}
                  onChange={(e) => handleInputChange('maxSalary', e.target.value)}
                  placeholder="400000"
                />
              </div>
            </div>

            {/* 希望勤務形態 */}
            <div className="space-y-2">
              <Label>希望勤務形態</Label>
              {formData.workStyles.map((style, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={style}
                    onChange={(e) => handleArrayChange('workStyles', index, e.target.value)}
                    placeholder="正社員、契約社員など"
                    className="flex-1"
                  />
                  {formData.workStyles.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('workStyles', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('workStyles')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                勤務形態を追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ステータス・コメント */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ステータス・コメント</CardTitle>
            <CardDescription>
              求職者のステータスとコメントを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                  <SelectItem value="placed">就職済み</SelectItem>
                  <SelectItem value="interviewing">面接中</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultantComment">コンサル紹介文</Label>
              <Textarea
                id="consultantComment"
                value={formData.consultantComment}
                onChange={(e) => handleInputChange('consultantComment', e.target.value)}
                placeholder="求職者の紹介文を入力してください"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="内部メモを入力してください"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex gap-4">
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
            登録
          </Button>
        </div>
      </form>
    </div>
  )
}