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
  params: Promise<{
    id: string
  }>
}

export default function EditCandidatePage({ params }: EditCandidatePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidateId, setCandidateId] = useState<string>('')
  const [candidate, setCandidate] = useState<Partial<Candidate>>({
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    enrollmentDate: '',
    campus: undefined,
    nearestStation: '',
    cookingExperience: '',
    
    // 希望
    jobSearchTiming: '',
    graduationCareerPlan: '',
    preferredArea: '',
    preferredWorkplace: '',
    futureCareerVision: '',
    questions: '',
    partTimeHope: '',
    
    // inner情報
    applicationFormUrl: '',
    resumeUrl: '',
    teacherComment: '',
    personalityScore: '',
    skillScore: '',
    interviewMemo: '',
    
    status: 'active'
  })

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setCandidateId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!candidateId) return

    const fetchCandidate = async () => {
      try {
        const candidateDoc = await getDoc(doc(db, 'candidates', candidateId))
        if (candidateDoc.exists()) {
          const candidateData = candidateDoc.data() as Candidate
          // すべてのフィールドが文字列として設定されるようにする
          setCandidate({
            ...candidateData,
            firstName: candidateData.firstName || '',
            lastName: candidateData.lastName || '',
            firstNameKana: candidateData.firstNameKana || '',
            lastNameKana: candidateData.lastNameKana || '',
            email: candidateData.email || '',
            phone: candidateData.phone || '',
            dateOfBirth: candidateData.dateOfBirth || '',
            enrollmentDate: candidateData.enrollmentDate || '',
            campus: candidateData.campus || undefined,
            nearestStation: candidateData.nearestStation || '',
            cookingExperience: candidateData.cookingExperience || '',
            jobSearchTiming: candidateData.jobSearchTiming || '',
            graduationCareerPlan: candidateData.graduationCareerPlan || '',
            preferredArea: candidateData.preferredArea || '',
            preferredWorkplace: candidateData.preferredWorkplace || '',
            futureCareerVision: candidateData.futureCareerVision || '',
            questions: candidateData.questions || '',
            partTimeHope: candidateData.partTimeHope || '',
            applicationFormUrl: candidateData.applicationFormUrl || '',
            resumeUrl: candidateData.resumeUrl || '',
            teacherComment: candidateData.teacherComment || '',
            personalityScore: candidateData.personalityScore || '',
            skillScore: candidateData.skillScore || '',
            interviewMemo: candidateData.interviewMemo || ''
          })
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
  }, [candidateId, router])

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
    if (!candidateId) return
    setSaving(true)

    try {
      const updatedCandidate = {
        ...candidate,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'candidates', candidateId), updatedCandidate)
      
      alert('求職者情報を更新しました')
      router.push(`/candidates/${candidateId}`)
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
        <Link href={`/candidates/${candidateId}`}>
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
            <div>
              <Label htmlFor="status">ステータス *</Label>
              <Select value={candidate.status ?? 'active'} onValueChange={(value) => handleChange('status', value)}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName">名前（姓） *</Label>
                <Input
                  id="lastName"
                  value={candidate.lastName ?? ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  placeholder="山田"
                />
              </div>

              <div>
                <Label htmlFor="firstName">名前（名） *</Label>
                <Input
                  id="firstName"
                  value={candidate.firstName ?? ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  placeholder="太郎"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastNameKana">フリガナ（姓）</Label>
                <Input
                  id="lastNameKana"
                  value={candidate.lastNameKana ?? ''}
                  onChange={(e) => handleChange('lastNameKana', e.target.value)}
                  placeholder="ヤマダ"
                />
              </div>

              <div>
                <Label htmlFor="firstNameKana">フリガナ（名）</Label>
                <Input
                  id="firstNameKana"
                  value={candidate.firstNameKana ?? ''}
                  onChange={(e) => handleChange('firstNameKana', e.target.value)}
                  placeholder="タロウ"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={candidate.dateOfBirth ?? ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="enrollmentDate">入学年月</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={candidate.enrollmentDate ?? ''}
                  onChange={(e) => handleChange('enrollmentDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={candidate.email ?? ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={candidate.phone ?? ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="090-1234-5678"
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
            </div>
          </CardContent>
        </Card>

        {/* 学校・個人情報 */}
        <Card>
          <CardHeader>
            <CardTitle>学校・個人情報</CardTitle>
            <CardDescription>飲食人大学と個人に関する情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="enrollmentDate">入学年月</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={candidate.enrollmentDate}
                  onChange={(e) => handleChange('enrollmentDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="campus">入学校舎</Label>
                <Select 
                  value={candidate.campus ?? ''} 
                  onValueChange={(value) => handleChange('campus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="校舎を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tokyo">東京校</SelectItem>
                    <SelectItem value="osaka">大阪校</SelectItem>
                    <SelectItem value="awaji">淡路校</SelectItem>
                    <SelectItem value="fukuoka">福岡校</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nearestStation">最寄り駅</Label>
                <Input
                  id="nearestStation"
                  value={candidate.nearestStation ?? ''}
                  onChange={(e) => handleChange('nearestStation', e.target.value)}
                  placeholder="新宿駅"
                />
              </div>

              <div>
                <Label htmlFor="cookingExperience">調理経験</Label>
                <Input
                  id="cookingExperience"
                  value={candidate.cookingExperience ?? ''}
                  onChange={(e) => handleChange('cookingExperience', e.target.value)}
                  placeholder="居酒屋で2年間"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 希望条件 */}
        <Card>
          <CardHeader>
            <CardTitle>希望条件</CardTitle>
            <CardDescription>求職者の希望について</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobSearchTiming">就職活動をスタートさせるタイミング</Label>
              <Textarea
                id="jobSearchTiming"
                value={candidate.jobSearchTiming ?? ''}
                onChange={(e) => handleChange('jobSearchTiming', e.target.value)}
                rows={3}
                placeholder="卒業の3ヶ月前から本格的に始めたい"
              />
            </div>

            <div>
              <Label htmlFor="graduationCareerPlan">卒業"直後"の希望進路</Label>
              <Textarea
                id="graduationCareerPlan"
                value={candidate.graduationCareerPlan ?? ''}
                onChange={(e) => handleChange('graduationCareerPlan', e.target.value)}
                rows={3}
                placeholder="高級寿司店で修行を積みたい"
              />
            </div>

            <div>
              <Label htmlFor="preferredArea">就職・開業希望エリア</Label>
              <Textarea
                id="preferredArea"
                value={candidate.preferredArea ?? ''}
                onChange={(e) => handleChange('preferredArea', e.target.value)}
                rows={2}
                placeholder="東京都内、神奈川県"
              />
            </div>

            <div>
              <Label htmlFor="preferredWorkplace">就職・開業したいお店の雰囲気・条件</Label>
              <Textarea
                id="preferredWorkplace"
                value={candidate.preferredWorkplace ?? ''}
                onChange={(e) => handleChange('preferredWorkplace', e.target.value)}
                rows={4}
                placeholder="カウンター越しにお客様と会話できる環境で働きたい"
              />
            </div>

            <div>
              <Label htmlFor="futureCareerVision">現時点で考えうる将来のキャリア像</Label>
              <Textarea
                id="futureCareerVision"
                value={candidate.futureCareerVision ?? ''}
                onChange={(e) => handleChange('futureCareerVision', e.target.value)}
                rows={4}
                placeholder="10年後には独立して自分の店を持ちたい"
              />
            </div>

            <div>
              <Label htmlFor="questions">その他、キャリア担当への質問・面談で聞きたいこと・伝えておきたいことなど</Label>
              <Textarea
                id="questions"
                value={candidate.questions ?? ''}
                onChange={(e) => handleChange('questions', e.target.value)}
                rows={4}
                placeholder="研修制度について詳しく知りたい"
              />
            </div>

            <div>
              <Label htmlFor="partTimeHope">在校中のアルバイト希望について</Label>
              <Textarea
                id="partTimeHope"
                value={candidate.partTimeHope ?? ''}
                onChange={(e) => handleChange('partTimeHope', e.target.value)}
                rows={3}
                placeholder="週3日程度で飲食店でのアルバイトを希望"
              />
            </div>
          </CardContent>
        </Card>

        {/* 内部管理情報 */}
        <Card>
          <CardHeader>
            <CardTitle>内部管理情報</CardTitle>
            <CardDescription>内部管理用の情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationFormUrl">願書URL</Label>
                <Input
                  id="applicationFormUrl"
                  value={candidate.applicationFormUrl ?? ''}
                  onChange={(e) => handleChange('applicationFormUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="resumeUrl">履歴書URL</Label>
                <Input
                  id="resumeUrl"
                  value={candidate.resumeUrl ?? ''}
                  onChange={(e) => handleChange('resumeUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="teacherComment">先生からのコメント</Label>
              <Textarea
                id="teacherComment"
                value={candidate.teacherComment ?? ''}
                onChange={(e) => handleChange('teacherComment', e.target.value)}
                rows={4}
                placeholder="真面目で向上心がある学生です"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="personalityScore">スコア（人物）</Label>
                <Input
                  id="personalityScore"
                  value={candidate.personalityScore ?? ''}
                  onChange={(e) => handleChange('personalityScore', e.target.value)}
                  placeholder="A、B、C等"
                />
              </div>

              <div>
                <Label htmlFor="skillScore">スコア（スキル）</Label>
                <Input
                  id="skillScore"
                  value={candidate.skillScore ?? ''}
                  onChange={(e) => handleChange('skillScore', e.target.value)}
                  placeholder="A、B、C等"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="interviewMemo">面談メモ</Label>
              <Textarea
                id="interviewMemo"
                value={candidate.interviewMemo ?? ''}
                onChange={(e) => handleChange('interviewMemo', e.target.value)}
                rows={5}
                placeholder="面談での印象や特記事項など"
              />
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
          
          <Link href={`/candidates/${candidateId}`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}