"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Briefcase, Save, Loader2 } from 'lucide-react'
import { createJob } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'
import { getStores } from '@/lib/firestore/stores'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  
  const [formData, setFormData] = useState({
    companyId: '',
    storeId: '',
    title: '',
    employmentType: '' as const,
    baseSalary: '',
    commission: false,
    tips: false,
    housingAllowance: '',
    transportationProvided: false,
    transportationMaxAmount: '',
    workingHours: '',
    shiftType: '',
    weeklyHolidays: '',
    holidays: '',
    jobDescription: '',
    requiredSkills: '',
    experienceYears: '',
    socialInsurance: false,
    uniform: false,
    meals: false,
    training: false,
    visibility: 'private' as const,
    status: 'draft' as const
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, storesData] = await Promise.all([
          getCompanies(),
          getStores()
        ])
        setCompanies(companiesData)
        setStores(storesData)
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (formData.companyId) {
      const filtered = stores.filter(store => store.companyId === formData.companyId)
      setFilteredStores(filtered)
      if (filtered.length === 0) {
        setFormData(prev => ({ ...prev, storeId: '' }))
      }
    } else {
      setFilteredStores([])
    }
  }, [formData.companyId, stores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !formData.storeId || !formData.title || !formData.employmentType) {
      alert('必須項目を入力してください')
      return
    }

    setLoading(true)

    try {
      const newJob: Omit<Job, 'id'> = {
        companyId: formData.companyId,
        storeId: formData.storeId,
        title: formData.title,
        employmentType: formData.employmentType as 'full-time' | 'contract' | 'part-time',
        salary: {
          baseSalary: formData.baseSalary ? parseInt(formData.baseSalary) : undefined,
          commission: formData.commission,
          tips: formData.tips,
          housingAllowance: formData.housingAllowance ? parseInt(formData.housingAllowance) : undefined,
          transportationAllowance: {
            provided: formData.transportationProvided,
            maxAmount: formData.transportationMaxAmount ? parseInt(formData.transportationMaxAmount) : undefined
          }
        },
        workSchedule: {
          workingHours: formData.workingHours || undefined,
          shiftType: formData.shiftType || undefined,
          weeklyHolidays: formData.weeklyHolidays ? parseInt(formData.weeklyHolidays) : undefined,
          holidays: formData.holidays || undefined
        },
        jobDescription: formData.jobDescription || undefined,
        requiredSkills: formData.requiredSkills || undefined,
        requirements: {
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined
        },
        benefits: {
          socialInsurance: formData.socialInsurance,
          uniform: formData.uniform,
          meals: formData.meals,
          training: formData.training
        },
        visibility: formData.visibility,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await createJob(newJob)
      alert('求人が正常に追加されました')
      router.push('/jobs')
    } catch (error) {
      console.error('求人の追加に失敗しました:', error)
      alert('求人の追加に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/jobs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            新規求人追加
          </h1>
          <p className="text-gray-600 mt-2">
            新しい求人の情報を入力
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
                求人の基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyId">企業 *</Label>
                <Select value={formData.companyId} onValueChange={(value) => handleChange('companyId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="企業を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="storeId">店舗 *</Label>
                <Select 
                  value={formData.storeId} 
                  onValueChange={(value) => handleChange('storeId', value)}
                  disabled={!formData.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.companyId ? "店舗を選択してください" : "まず企業を選択してください"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">求人タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="例: 寿司職人募集"
                  required
                />
              </div>

              <div>
                <Label htmlFor="employmentType">雇用形態 *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="雇用形態を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">正社員</SelectItem>
                    <SelectItem value="contract">契約社員</SelectItem>
                    <SelectItem value="part-time">アルバイト</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobDescription">職務内容</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleChange('jobDescription', e.target.value)}
                  placeholder="職務内容を詳しく記載してください"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="requiredSkills">求めるスキル</Label>
                <Textarea
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => handleChange('requiredSkills', e.target.value)}
                  placeholder="握り、仕込み、焼き、接客、衛生など"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 給与・勤務条件 */}
          <Card>
            <CardHeader>
              <CardTitle>給与・勤務条件</CardTitle>
              <CardDescription>
                給与と勤務に関する情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseSalary">基本給（円）</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleChange('baseSalary', e.target.value)}
                    placeholder="300000"
                  />
                </div>
                <div>
                  <Label htmlFor="housingAllowance">住宅手当（円）</Label>
                  <Input
                    id="housingAllowance"
                    type="number"
                    value={formData.housingAllowance}
                    onChange={(e) => handleChange('housingAllowance', e.target.value)}
                    placeholder="20000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="commission"
                    checked={formData.commission}
                    onCheckedChange={(checked) => handleChange('commission', checked as boolean)}
                  />
                  <Label htmlFor="commission">歩合制</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tips"
                    checked={formData.tips}
                    onCheckedChange={(checked) => handleChange('tips', checked as boolean)}
                  />
                  <Label htmlFor="tips">チップ制</Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportationProvided"
                    checked={formData.transportationProvided}
                    onCheckedChange={(checked) => handleChange('transportationProvided', checked as boolean)}
                  />
                  <Label htmlFor="transportationProvided">交通費支給</Label>
                </div>
                {formData.transportationProvided && (
                  <div>
                    <Label htmlFor="transportationMaxAmount">交通費上限額（円）</Label>
                    <Input
                      id="transportationMaxAmount"
                      type="number"
                      value={formData.transportationMaxAmount}
                      onChange={(e) => handleChange('transportationMaxAmount', e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="workingHours">勤務時間</Label>
                <Input
                  id="workingHours"
                  value={formData.workingHours}
                  onChange={(e) => handleChange('workingHours', e.target.value)}
                  placeholder="例: 10:00〜22:00"
                />
              </div>

              <div>
                <Label htmlFor="weeklyHolidays">週休日数</Label>
                <Input
                  id="weeklyHolidays"
                  type="number"
                  value={formData.weeklyHolidays}
                  onChange={(e) => handleChange('weeklyHolidays', e.target.value)}
                  placeholder="2"
                />
              </div>

              <div>
                <Label htmlFor="holidays">休日詳細</Label>
                <Input
                  id="holidays"
                  value={formData.holidays}
                  onChange={(e) => handleChange('holidays', e.target.value)}
                  placeholder="例: 木曜日、第3金曜日"
                />
              </div>
            </CardContent>
          </Card>

          {/* 応募条件・福利厚生 */}
          <Card>
            <CardHeader>
              <CardTitle>応募条件・福利厚生</CardTitle>
              <CardDescription>
                応募に関する条件と福利厚生を設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="experienceYears">必要経験年数</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => handleChange('experienceYears', e.target.value)}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label>福利厚生</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="socialInsurance"
                      checked={formData.socialInsurance}
                      onCheckedChange={(checked) => handleChange('socialInsurance', checked as boolean)}
                    />
                    <Label htmlFor="socialInsurance">社会保険</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uniform"
                      checked={formData.uniform}
                      onCheckedChange={(checked) => handleChange('uniform', checked as boolean)}
                    />
                    <Label htmlFor="uniform">制服支給</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meals"
                      checked={formData.meals}
                      onCheckedChange={(checked) => handleChange('meals', checked as boolean)}
                    />
                    <Label htmlFor="meals">食事支給</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="training"
                      checked={formData.training}
                      onCheckedChange={(checked) => handleChange('training', checked as boolean)}
                    />
                    <Label htmlFor="training">研修制度</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 公開設定 */}
          <Card>
            <CardHeader>
              <CardTitle>公開設定</CardTitle>
              <CardDescription>
                求人の公開範囲とステータスを設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="visibility">公開範囲</Label>
                <Select value={formData.visibility} onValueChange={(value) => handleChange('visibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">非公開</SelectItem>
                    <SelectItem value="limited">限定公開</SelectItem>
                    <SelectItem value="public">公開</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">求人ステータス</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="active">公開中</SelectItem>
                    <SelectItem value="paused">一時停止</SelectItem>
                    <SelectItem value="closed">終了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/jobs">
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
                求人を追加
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
