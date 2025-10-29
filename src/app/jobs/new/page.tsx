"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Building2, Briefcase, Plus } from 'lucide-react'
import { createJob } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'
import { getStores } from '@/lib/firestore/stores'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

export default function NewJobPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  
    const [formData, setFormData] = useState({
    companyId: '',
    storeId: 'none',
    title: '',
    businessType: '',
    employmentType: '',
    trialPeriod: '',
    workingHours: '',
    holidays: '',
    overtime: '',
    salaryInexperienced: '',
    salaryExperienced: '',
    requiredSkills: '',
    jobDescription: '',
    smokingPolicy: '',
    insurance: '',
    benefits: '',
    selectionProcess: '',
    consultantReview: '',
    status: 'draft' as const,
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

  // URLパラメータの処理を別のuseEffectで実行
  useEffect(() => {
    if (companies.length > 0 && stores.length > 0) {
      const companyParam = searchParams.get('company')
      const storeParam = searchParams.get('store')
      
      console.log('Company param from URL:', companyParam)
      console.log('Store param from URL:', storeParam)
      console.log('Available companies:', companies.map(c => c.id))
      console.log('Available stores:', stores.map(s => s.id))
      
      if (companyParam && companies.some(company => company.id === companyParam)) {
        console.log('Setting company ID to:', companyParam)
        
        const updatedFormData: any = {
          companyId: companyParam
        }
        
        // 店舗IDも指定されている場合、その店舗が企業に属しているかチェック
        if (storeParam && stores.some(store => store.id === storeParam && store.companyId === companyParam)) {
          console.log('Setting store ID to:', storeParam)
          updatedFormData.storeId = storeParam
        }
        
        setFormData(prev => ({
          ...prev,
          ...updatedFormData
        }))
      } else {
        console.log('Company param not found or invalid')
      }
    }
  }, [companies, stores, searchParams])

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
        title: formData.title,
        companyId: formData.companyId,
        storeId: formData.storeId === 'none' ? undefined : formData.storeId,
        businessType: formData.businessType || undefined,
        employmentType: formData.employmentType || undefined,
        trialPeriod: formData.trialPeriod || undefined,
        workingHours: formData.workingHours || undefined,
        holidays: formData.holidays || undefined,
        overtime: formData.overtime || undefined,
        salaryInexperienced: formData.salaryInexperienced || undefined,
        salaryExperienced: formData.salaryExperienced || undefined,
        requiredSkills: formData.requiredSkills || undefined,
        jobDescription: formData.jobDescription || undefined,
        smokingPolicy: formData.smokingPolicy || undefined,
        insurance: formData.insurance || undefined,
        benefits: formData.benefits || undefined,
        selectionProcess: formData.selectionProcess || undefined,
        consultantReview: formData.consultantReview || undefined,
        status: formData.status || 'draft',
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

  const handleChange = (field: string, value: any) => {
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>求人の基本的な情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">職種名 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="例: 寿司職人、調理補助、ホールスタッフ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyId">企業 *</Label>
                <Select 
                  value={formData.companyId} 
                  onValueChange={(value) => {
                    handleChange('companyId', value)
                    handleChange('storeId', 'none')
                  }}
                  required
                >
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
                <Label htmlFor="storeId">店舗</Label>
                <Select 
                  value={formData.storeId} 
                  onValueChange={(value) => handleChange('storeId', value)}
                  disabled={!formData.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="店舗を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">店舗なし</SelectItem>
                    {filteredStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessType">業態</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  placeholder="例: 回転寿司、カウンター寿司"
                />
              </div>

              <div>
                <Label htmlFor="employmentType">雇用形態</Label>
                <Input
                  id="employmentType"
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  placeholder="例: 正社員、アルバイト"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>勤務条件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trialPeriod">試用期間</Label>
              <Input
                id="trialPeriod"
                value={formData.trialPeriod}
                onChange={(e) => handleChange('trialPeriod', e.target.value)}
                placeholder="例: 3ヶ月"
              />
            </div>

            <div>
              <Label htmlFor="workingHours">勤務時間</Label>
              <Textarea
                id="workingHours"
                value={formData.workingHours}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                rows={3}
                placeholder="例: 10:00〜22:00（実働8時間）"
              />
            </div>

            <div>
              <Label htmlFor="holidays">休日・休暇</Label>
              <Textarea
                id="holidays"
                value={formData.holidays}
                onChange={(e) => handleChange('holidays', e.target.value)}
                rows={3}
                placeholder="例: 週休2日制、年末年始休暇"
              />
            </div>

            <div>
              <Label htmlFor="overtime">時間外労働</Label>
              <Textarea
                id="overtime"
                value={formData.overtime}
                onChange={(e) => handleChange('overtime', e.target.value)}
                rows={2}
                placeholder="例: 月平均20時間"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>給与情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salaryInexperienced">給与（未経験）</Label>
              <Textarea
                id="salaryInexperienced"
                value={formData.salaryInexperienced}
                onChange={(e) => handleChange('salaryInexperienced', e.target.value)}
                rows={3}
                placeholder="例: 月給22万円〜"
              />
            </div>

            <div>
              <Label htmlFor="salaryExperienced">給与（経験者）</Label>
              <Textarea
                id="salaryExperienced"
                value={formData.salaryExperienced}
                onChange={(e) => handleChange('salaryExperienced', e.target.value)}
                rows={3}
                placeholder="例: 月給28万円〜"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>職務・スキル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requiredSkills">求めるスキル</Label>
              <Textarea
                id="requiredSkills"
                value={formData.requiredSkills}
                onChange={(e) => handleChange('requiredSkills', e.target.value)}
                rows={4}
                placeholder="例: 寿司握り経験、調理経験"
              />
            </div>

            <div>
              <Label htmlFor="jobDescription">職務内容</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                rows={5}
                placeholder="寿司の握り、仕込み、接客業務など"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>職場環境・福利厚生</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="smokingPolicy">受動喫煙防止措置</Label>
              <Textarea
                id="smokingPolicy"
                value={formData.smokingPolicy}
                onChange={(e) => handleChange('smokingPolicy', e.target.value)}
                rows={2}
                placeholder="例: 全席禁煙、分煙"
              />
            </div>

            <div>
              <Label htmlFor="insurance">加入保険</Label>
              <Textarea
                id="insurance"
                value={formData.insurance}
                onChange={(e) => handleChange('insurance', e.target.value)}
                rows={2}
                placeholder="例: 雇用保険、労災保険"
              />
            </div>

            <div>
              <Label htmlFor="benefits">待遇・福利厚生</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                rows={4}
                placeholder="例: 交通費支給、制服貸与"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>選考・その他</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="selectionProcess">選考プロセス</Label>
              <Textarea
                id="selectionProcess"
                value={formData.selectionProcess}
                onChange={(e) => handleChange('selectionProcess', e.target.value)}
                rows={4}
                placeholder="例: 書類選考 → 面接 → 内定"
              />
            </div>

            <div>
              <Label htmlFor="consultantReview">キャリア担当からの&quot;正直な&quot;感想</Label>
              <Textarea
                id="consultantReview"
                value={formData.consultantReview}
                onChange={(e) => handleChange('consultantReview', e.target.value)}
                rows={5}
                placeholder="求人やお店の雰囲気、働きやすさなどについての正直な感想"
              />
            </div>

            <div>
              <Label htmlFor="status">求人ステータス</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="published">公開中</SelectItem>
                  <SelectItem value="active">募集中</SelectItem>
                  <SelectItem value="paused">一時停止</SelectItem>
                  <SelectItem value="closed">募集終了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {loading ? '作成中...' : '求人を作成'}
          </Button>
          
          <Link href="/jobs">
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
