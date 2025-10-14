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
import { ArrowLeft, Users, Save, Loader2 } from 'lucide-react'
import { createCandidate } from '@/lib/firestore/candidates'
import { Candidate } from '@/types/candidate'

export default function NewCandidatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as const,
    skills: '',
    consultantComment: '',
    status: 'active' as const
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)

      const newCandidate: Omit<Candidate, 'id'> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        firstNameKana: formData.firstNameKana,
        lastNameKana: formData.lastNameKana,
        email: formData.email,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined,
        experience: [],
        education: [],
        skills: skillsArray,
        certifications: [],
        preferences: {},
        consultantComment: formData.consultantComment || undefined,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await createCandidate(newCandidate)
      alert('求職者が正常に追加されました')
      router.push('/candidates')
    } catch (error) {
      console.error('求職者の追加に失敗しました:', error)
      alert('求職者の追加に失敗しました。もう一度お試しください。')
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
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
        <Link href="/candidates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            新規求職者追加
          </h1>
          <p className="text-gray-600 mt-2">
            新しい求職者の情報を入力
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
                求職者の基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">姓 *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="田中"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">名 *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="太郎"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastNameKana">姓（カナ）</Label>
                  <Input
                    id="lastNameKana"
                    value={formData.lastNameKana}
                    onChange={(e) => handleChange('lastNameKana', e.target.value)}
                    placeholder="タナカ"
                  />
                </div>
                <div>
                  <Label htmlFor="firstNameKana">名（カナ）</Label>
                  <Input
                    id="firstNameKana"
                    value={formData.firstNameKana}
                    onChange={(e) => handleChange('firstNameKana', e.target.value)}
                    placeholder="タロウ"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="gender">性別</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="性別を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                    <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活動中</SelectItem>
                    <SelectItem value="inactive">非活動</SelectItem>
                    <SelectItem value="placed">就職済み</SelectItem>
                    <SelectItem value="interviewing">面接中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* スキル・その他情報 */}
          <Card>
            <CardHeader>
              <CardTitle>スキル・その他情報</CardTitle>
              <CardDescription>
                求職者のスキルやコメントを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="skills">スキル</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  placeholder="握り, 仕込み, 焼き, 接客, 衛生管理 (カンマ区切り)"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  スキルはカンマ(,)で区切って入力してください
                </p>
              </div>

              <div>
                <Label htmlFor="consultantComment">コンサル作成の紹介文</Label>
                <Textarea
                  id="consultantComment"
                  value={formData.consultantComment}
                  onChange={(e) => handleChange('consultantComment', e.target.value)}
                  placeholder="求職者の特徴や強みを記載してください"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/candidates">
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
                求職者を追加
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </ProtectedRoute>
  )
}