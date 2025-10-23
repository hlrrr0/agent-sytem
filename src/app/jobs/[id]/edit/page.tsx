"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Briefcase, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

interface EditJobPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [jobId, setJobId] = useState<string>('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [job, setJob] = useState<Partial<Job>>({
    title: '',
    companyId: '',
    storeId: 'none',
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
    status: 'draft'
  })

  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      setJobId(resolvedParams.id)
      
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', resolvedParams.id))
        if (jobDoc.exists()) {
          const jobData = jobDoc.data() as Job
          setJob({
            ...jobData,
            storeId: jobData.storeId || 'none'
          })
        }

        const companiesSnapshot = await getDocs(collection(db, 'companies'))
        const companiesList = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[]
        setCompanies(companiesList)

        const storesSnapshot = await getDocs(collection(db, 'stores'))
        const storesList = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Store[]
        setStores(storesList)

      } catch (error) {
        console.error('データ取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeComponent()
  }, [params])

  useEffect(() => {
    if (job.companyId) {
      const filtered = stores.filter(store => store.companyId === job.companyId)
      setFilteredStores(filtered)
    } else {
      setFilteredStores([])
    }
  }, [job.companyId, stores])

  const handleChange = (field: keyof Job, value: any) => {
    setJob(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedJob = {
        ...job,
        storeId: job.storeId === 'none' ? undefined : job.storeId,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'jobs', jobId), updatedJob)
      alert('求人情報を更新しました')
      router.push('/jobs/' + jobId)
    } catch (error) {
      console.error('求人更新に失敗しました:', error)
      alert('求人更新に失敗しました')
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
        <Link href={'/jobs/' + jobId}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            求人編集
          </h1>
          <p className="text-gray-600 mt-2">求人情報を編集します</p>
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
                value={job.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="例: 寿司職人、調理補助、ホールスタッフ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyId">企業 *</Label>
                <Select 
                  value={job.companyId || ''} 
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
                  value={job.storeId || ''} 
                  onValueChange={(value) => handleChange('storeId', value)}
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

            <div>
              <Label htmlFor="businessType">業態</Label>
              <Input
                id="businessType"
                value={job.businessType || ''}
                onChange={(e) => handleChange('businessType', e.target.value)}
                placeholder="例: 回転寿司、カウンター寿司"
              />
            </div>

            <div>
              <Label htmlFor="employmentType">雇用形態</Label>
              <Input
                id="employmentType"
                value={job.employmentType || ''}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                placeholder="例: 正社員、アルバイト"
              />
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
                value={job.trialPeriod || ''}
                onChange={(e) => handleChange('trialPeriod', e.target.value)}
                placeholder="例: 3ヶ月"
              />
            </div>

            <div>
              <Label htmlFor="workingHours">勤務時間</Label>
              <Textarea
                id="workingHours"
                value={job.workingHours || ''}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                rows={3}
                placeholder="例: 10:00〜22:00（実働8時間）"
              />
            </div>

            <div>
              <Label htmlFor="holidays">休日・休暇</Label>
              <Textarea
                id="holidays"
                value={job.holidays || ''}
                onChange={(e) => handleChange('holidays', e.target.value)}
                rows={3}
                placeholder="例: 週休2日制、年末年始休暇"
              />
            </div>

            <div>
              <Label htmlFor="overtime">時間外労働</Label>
              <Textarea
                id="overtime"
                value={job.overtime || ''}
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
                value={job.salaryInexperienced || ''}
                onChange={(e) => handleChange('salaryInexperienced', e.target.value)}
                rows={3}
                placeholder="例: 月給22万円〜"
              />
            </div>

            <div>
              <Label htmlFor="salaryExperienced">給与（経験者）</Label>
              <Textarea
                id="salaryExperienced"
                value={job.salaryExperienced || ''}
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
                value={job.requiredSkills || ''}
                onChange={(e) => handleChange('requiredSkills', e.target.value)}
                rows={4}
                placeholder="例: 寿司握り経験、調理経験"
              />
            </div>

            <div>
              <Label htmlFor="jobDescription">職務内容</Label>
              <Textarea
                id="jobDescription"
                value={job.jobDescription || ''}
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
                value={job.smokingPolicy || ''}
                onChange={(e) => handleChange('smokingPolicy', e.target.value)}
                rows={2}
                placeholder="例: 全席禁煙、分煙"
              />
            </div>

            <div>
              <Label htmlFor="insurance">加入保険</Label>
              <Textarea
                id="insurance"
                value={job.insurance || ''}
                onChange={(e) => handleChange('insurance', e.target.value)}
                rows={2}
                placeholder="例: 雇用保険、労災保険"
              />
            </div>

            <div>
              <Label htmlFor="benefits">待遇・福利厚生</Label>
              <Textarea
                id="benefits"
                value={job.benefits || ''}
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
                value={job.selectionProcess || ''}
                onChange={(e) => handleChange('selectionProcess', e.target.value)}
                rows={4}
                placeholder="例: 書類選考 → 面接 → 内定"
              />
            </div>

            <div>
              <Label htmlFor="consultantReview">キャリア担当からの&quot;正直な&quot;感想</Label>
              <Textarea
                id="consultantReview"
                value={job.consultantReview || ''}
                onChange={(e) => handleChange('consultantReview', e.target.value)}
                rows={5}
                placeholder="求人やお店の雰囲気、働きやすさなどについての正直な感想"
              />
            </div>

            <div>
              <Label htmlFor="status">求人ステータス</Label>
              <Select 
                value={job.status || 'draft'} 
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
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '更新中...' : '更新する'}
          </Button>
          
          <Link href={'/jobs/' + jobId}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
