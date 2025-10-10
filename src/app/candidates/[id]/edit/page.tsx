"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Users, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Candidate } from '@/types/candidate'

interface EditCandidatePageProps {
  params: {
    id: string
  }
}

export default function EditCandidatePage({ params }: EditCandidatePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidate, setCandidate] = useState<Partial<Candidate>>({
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    enrollmentMonth: '',
    campus: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    preferences: {},
    status: 'active'
  })

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const candidateDoc = await getDoc(doc(db, 'candidates', params.id))
        if (candidateDoc.exists()) {
          const candidateData = candidateDoc.data() as Candidate
          setCandidate(candidateData)
        } else {
          alert('求職者が見つかりません')
          router.push('/candidates')
        }
      } catch (error) {
        console.error('求職者データの取得に失敗しました:', error)
        alert('求職者データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidate()
  }, [params.id, router])

  const handleChange = (field: keyof Candidate, value: any) => {
    setCandidate(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillsChange = (value: string) => {
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill)
    setCandidate(prev => ({
      ...prev,
      skills: skillsArray
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedCandidate = {
        ...candidate,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'candidates', params.id), updatedCandidate)
      
      alert('求職者情報を更新しました')
      router.push(`/candidates/${params.id}`)
    } catch (error) {
      console.error('求職者更新に失敗しました:', error)
      alert('求職者更新に失敗しました')
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
        <Link href={`/candidates/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            求職者編集
          </h1>
          <p className="text-gray-600 mt-2">
            求職者情報を編集します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>求職者の基本的な情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName">姓 *</Label>
                <Input
                  id="lastName"
                  value={candidate.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="firstName">名 *</Label>
                <Input
                  id="firstName"
                  value={candidate.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastNameKana">セイ</Label>
                <Input
                  id="lastNameKana"
                  value={candidate.lastNameKana}
                  onChange={(e) => handleChange('lastNameKana', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="firstNameKana">メイ</Label>
                <Input
                  id="firstNameKana"
                  value={candidate.firstNameKana}
                  onChange={(e) => handleChange('firstNameKana', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={candidate.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={candidate.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={typeof candidate.dateOfBirth === 'string' ? candidate.dateOfBirth.split('T')[0] : ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="gender">性別</Label>
                <Select 
                  value={candidate.gender} 
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
        <Card>
          <CardHeader>
            <CardTitle>飲食人大学情報</CardTitle>
            <CardDescription>飲食人大学に関する情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="enrollmentMonth">入学月</Label>
                <Input
                  id="enrollmentMonth"
                  value={candidate.enrollmentMonth}
                  onChange={(e) => handleChange('enrollmentMonth', e.target.value)}
                  placeholder="例: 2024年4月"
                />
              </div>

              <div>
                <Label htmlFor="campus">入学校舎</Label>
                <Input
                  id="campus"
                  value={candidate.campus}
                  onChange={(e) => handleChange('campus', e.target.value)}
                  placeholder="例: 東京校"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スキル・資格 */}
        <Card>
          <CardHeader>
            <CardTitle>スキル・資格</CardTitle>
            <CardDescription>保有スキルや資格について</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="skills">スキル</Label>
              <Textarea
                id="skills"
                value={candidate.skills?.join(', ') || ''}
                onChange={(e) => handleSkillsChange(e.target.value)}
                rows={3}
                placeholder="スキルをカンマ区切りで入力してください（例: 寿司握り, 接客, 英語会話）"
              />
            </div>

            <div>
              <Label htmlFor="consultantComment">コンサル作成の紹介文</Label>
              <Textarea
                id="consultantComment"
                value={candidate.consultantComment}
                onChange={(e) => handleChange('consultantComment', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="instructorComment">講師コメント</Label>
              <Textarea
                id="instructorComment"
                value={candidate.instructorComment}
                onChange={(e) => handleChange('instructorComment', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={candidate.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ステータス */}
        <Card>
          <CardHeader>
            <CardTitle>ステータス</CardTitle>
            <CardDescription>求職者の現在のステータス</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select 
                value={candidate.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
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
          
          <Link href={`/candidates/${params.id}`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}