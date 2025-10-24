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
import { ArrowLeft, Users, Save } from 'lucide-react'
import { createCandidate } from '@/lib/firestore/candidates'
import { Candidate } from '@/types/candidate'

export default function NewCandidatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // 基本情報（必須）
    status: 'active' as const,
    lastName: '',
    firstName: '',
    
    // 基本情報（任意）
    lastNameKana: '',
    firstNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    enrollmentDate: '',
    campus: '' as const,
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
    interviewMemo: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName) {
      alert('名前（姓・名）は必須項目です')
      return
    }

    setLoading(true)

    try {
      const newCandidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
        // 基本情報（必須）
        status: formData.status,
        lastName: formData.lastName,
        firstName: formData.firstName,
        
        // 基本情報（任意）
        lastNameKana: formData.lastNameKana || undefined,
        firstNameKana: formData.firstNameKana || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        enrollmentDate: formData.enrollmentDate || undefined,
        campus: formData.campus || undefined,
        nearestStation: formData.nearestStation || undefined,
        cookingExperience: formData.cookingExperience || undefined,
        
        // 希望
        jobSearchTiming: formData.jobSearchTiming || undefined,
        graduationCareerPlan: formData.graduationCareerPlan || undefined,
        preferredArea: formData.preferredArea || undefined,
        preferredWorkplace: formData.preferredWorkplace || undefined,
        futureCareerVision: formData.futureCareerVision || undefined,
        questions: formData.questions || undefined,
        partTimeHope: formData.partTimeHope || undefined,
        
        // inner情報
        applicationFormUrl: formData.applicationFormUrl || undefined,
        resumeUrl: formData.resumeUrl || undefined,
        teacherComment: formData.teacherComment || undefined,
        personalityScore: formData.personalityScore || undefined,
        skillScore: formData.skillScore || undefined,
        interviewMemo: formData.interviewMemo || undefined
      }

      console.log('🆕 新規求職者データ:', newCandidate)
      const candidateId = await createCandidate(newCandidate)
      console.log('✅ 求職者作成完了 ID:', candidateId)
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
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
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
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  placeholder="山田"
                />
              </div>

              <div>
                <Label htmlFor="firstName">名前（名） *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
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
                  value={formData.lastNameKana}
                  onChange={(e) => handleChange('lastNameKana', e.target.value)}
                  placeholder="ヤマダ"
                />
              </div>

              <div>
                <Label htmlFor="firstNameKana">フリガナ（名）</Label>
                <Input
                  id="firstNameKana"
                  value={formData.firstNameKana}
                  onChange={(e) => handleChange('firstNameKana', e.target.value)}
                  placeholder="タロウ"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="090-1234-5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="enrollmentDate">入学年月</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => handleChange('enrollmentDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="campus">入学校舎</Label>
                <Select value={formData.campus} onValueChange={(value) => handleChange('campus', value)}>
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
                  value={formData.nearestStation}
                  onChange={(e) => handleChange('nearestStation', e.target.value)}
                  placeholder="新宿駅"
                />
              </div>

              <div>
                <Label htmlFor="cookingExperience">調理経験</Label>
                <Input
                  id="cookingExperience"
                  value={formData.cookingExperience}
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
            <CardDescription>求職者の希望について詳しく聞かせてください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobSearchTiming">就職活動をスタートさせるタイミング</Label>
              <Textarea
                id="jobSearchTiming"
                value={formData.jobSearchTiming}
                onChange={(e) => handleChange('jobSearchTiming', e.target.value)}
                rows={3}
                placeholder="卒業の3ヶ月前から本格的に始めたい"
              />
            </div>

            <div>
              <Label htmlFor="graduationCareerPlan">卒業&quot;直後&quot;の希望進路</Label>
              <Textarea
                id="graduationCareerPlan"
                value={formData.graduationCareerPlan}
                onChange={(e) => handleChange('graduationCareerPlan', e.target.value)}
                rows={3}
                placeholder="高級寿司店で修行を積みたい"
              />
            </div>

            <div>
              <Label htmlFor="preferredArea">就職・開業希望エリア</Label>
              <Textarea
                id="preferredArea"
                value={formData.preferredArea}
                onChange={(e) => handleChange('preferredArea', e.target.value)}
                rows={2}
                placeholder="東京都内、神奈川県"
              />
            </div>

            <div>
              <Label htmlFor="preferredWorkplace">就職・開業したいお店の雰囲気・条件</Label>
              <Textarea
                id="preferredWorkplace"
                value={formData.preferredWorkplace}
                onChange={(e) => handleChange('preferredWorkplace', e.target.value)}
                rows={4}
                placeholder="カウンター越しにお客様と会話できる環境で働きたい"
              />
            </div>

            <div>
              <Label htmlFor="futureCareerVision">現時点で考えうる将来のキャリア像</Label>
              <Textarea
                id="futureCareerVision"
                value={formData.futureCareerVision}
                onChange={(e) => handleChange('futureCareerVision', e.target.value)}
                rows={4}
                placeholder="10年後には独立して自分の店を持ちたい"
              />
            </div>

            <div>
              <Label htmlFor="questions">その他、キャリア担当への質問・面談で聞きたいこと・伝えておきたいことなど</Label>
              <Textarea
                id="questions"
                value={formData.questions}
                onChange={(e) => handleChange('questions', e.target.value)}
                rows={4}
                placeholder="研修制度について詳しく知りたい"
              />
            </div>

            <div>
              <Label htmlFor="partTimeHope">在校中のアルバイト希望について</Label>
              <Textarea
                id="partTimeHope"
                value={formData.partTimeHope}
                onChange={(e) => handleChange('partTimeHope', e.target.value)}
                rows={3}
                placeholder="週3日程度で飲食店でのアルバイトを希望"
              />
            </div>
          </CardContent>
        </Card>

        {/* inner情報 */}
        <Card>
          <CardHeader>
            <CardTitle>内部管理情報</CardTitle>
            <CardDescription>内部管理用の情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationFormUrl">願書URL</Label>
                <Input
                  id="applicationFormUrl"
                  value={formData.applicationFormUrl}
                  onChange={(e) => handleChange('applicationFormUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="resumeUrl">履歴書URL</Label>
                <Input
                  id="resumeUrl"
                  value={formData.resumeUrl}
                  onChange={(e) => handleChange('resumeUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="teacherComment">先生からのコメント</Label>
              <Textarea
                id="teacherComment"
                value={formData.teacherComment}
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
                  value={formData.personalityScore}
                  onChange={(e) => handleChange('personalityScore', e.target.value)}
                  placeholder="A、B、C等"
                />
              </div>

              <div>
                <Label htmlFor="skillScore">スコア（スキル）</Label>
                <Input
                  id="skillScore"
                  value={formData.skillScore}
                  onChange={(e) => handleChange('skillScore', e.target.value)}
                  placeholder="A、B、C等"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="interviewMemo">面談メモ</Label>
              <Textarea
                id="interviewMemo"
                value={formData.interviewMemo}
                onChange={(e) => handleChange('interviewMemo', e.target.value)}
                rows={5}
                placeholder="面談での印象や特記事項など"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? '作成中...' : '求職者を作成'}
          </Button>
          
          <Link href="/candidates">
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
      </div>
    </ProtectedRoute>
  )
}