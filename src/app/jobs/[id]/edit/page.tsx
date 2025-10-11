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
  params: {
    id: string
  }
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [job, setJob] = useState<Partial<Job>>({
    title: '',
    companyId: '',
    storeId: '',
    jobDescription: '',
    requiredSkills: '',
    preferredQualifications: '',
    employmentType: 'full-time',
    salary: {
      baseSalary: 0
    },
    workSchedule: {
      workingHours: '',
      holidays: ''
    },
    benefits: {},
    requirements: {},
    visibility: 'private',
    status: 'draft'
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 求人データを取得
        const jobDoc = await getDoc(doc(db, 'jobs', params.id))
        if (jobDoc.exists()) {
          const jobData = jobDoc.data() as Job
          setJob(jobData)
        } else {
          alert('求人が見つかりません')
          router.push('/jobs')
          return
        }

        // 企業一覧を取得
        const companiesSnapshot = await getDocs(collection(db, 'companies'))
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[]
        setCompanies(companiesData)

        // 店舗一覧を取得
        const storesSnapshot = await getDocs(collection(db, 'stores'))
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Store[]
        setStores(storesData)
        
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
        alert('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  useEffect(() => {
    // 選択された企業の店舗のみをフィルタリング
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

  const handleSalaryChange = (field: 'type' | 'min' | 'max', value: any) => {
    setJob(prev => ({
      ...prev,
      salary: {
        ...prev.salary!,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedJob = {
        ...job,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'jobs', params.id), updatedJob)
      
      alert('求人情報を更新しました')
      router.push(`/jobs/${params.id}`)
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
        <Link href={`/jobs/${params.id}`}>
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
          <p className="text-gray-600 mt-2">
            求人情報を編集します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>求人の基本的な情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">求人タイトル *</Label>
              <Input
                id="title"
                value={job.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyId">企業 *</Label>
                <Select 
                  value={job.companyId} 
                  onValueChange={(value) => {
                    handleChange('companyId', value)
                    handleChange('storeId', '') // 企業変更時に店舗をリセット
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="企業を選択" />
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
                  value={job.storeId} 
                  onValueChange={(value) => handleChange('storeId', value)}
                  disabled={!job.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="店舗を選択（任意）" />
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
            </div>

            <div>
              <Label htmlFor="requiredSkills">求めるスキル</Label>
              <Textarea
                id="requiredSkills"
                value={job.requiredSkills}
                onChange={(e) => handleChange('requiredSkills', e.target.value)}
                rows={3}
                placeholder="握り／仕込み／焼き／接客／衛生等"
              />
            </div>
          </CardContent>
        </Card>

        {/* 職務内容 */}
        <Card>
          <CardHeader>
            <CardTitle>職務内容</CardTitle>
            <CardDescription>求人の詳細な内容を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobDescription">職務内容 *</Label>
              <Textarea
                id="jobDescription"
                value={job.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="requirements">応募要件</Label>
              <Textarea
                id="requirements"
                value={typeof job.requirements === 'string' ? job.requirements : ''}
                onChange={(e) => handleChange('requirements', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="preferredQualifications">歓迎条件</Label>
              <Textarea
                id="preferredQualifications"
                value={job.preferredQualifications || ''}
                onChange={(e) => handleChange('preferredQualifications', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 雇用条件 */}
        <Card>
          <CardHeader>
            <CardTitle>雇用条件</CardTitle>
            <CardDescription>給与や勤務条件を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employmentType">雇用形態</Label>
              <Select 
                value={job.employmentType} 
                onValueChange={(value) => handleChange('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">正社員</SelectItem>
                  <SelectItem value="part-time">パート・アルバイト</SelectItem>
                  <SelectItem value="contract">契約社員</SelectItem>
                  <SelectItem value="temporary">派遣社員</SelectItem>
                  <SelectItem value="internship">インターンシップ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>給与</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salaryType">給与形態</Label>
                  <Select 
                    value={job.salary?.type || 'hourly'} 
                    onValueChange={(value) => handleSalaryChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">時給</SelectItem>
                      <SelectItem value="daily">日給</SelectItem>
                      <SelectItem value="monthly">月給</SelectItem>
                      <SelectItem value="annual">年収</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salaryMin">最低額</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={job.salary?.min || 0}
                    onChange={(e) => handleSalaryChange('min', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="salaryMax">最高額</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={job.salary?.max || 0}
                    onChange={(e) => handleSalaryChange('max', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="workingHours">勤務時間</Label>
              <Input
                id="workingHours"
                value={job.workingHours}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                placeholder="例: 9:00-18:00"
              />
            </div>

            <div>
              <Label htmlFor="holidays">休日・休暇</Label>
              <Input
                id="holidays"
                value={job.holidays}
                onChange={(e) => handleChange('holidays', e.target.value)}
                placeholder="例: 土日祝、年末年始"
              />
            </div>
          </CardContent>
        </Card>

        {/* 応募情報 */}
        <Card>
          <CardHeader>
            <CardTitle>応募情報</CardTitle>
            <CardDescription>応募方法や連絡先を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="applicationProcess">応募方法</Label>
              <Textarea
                id="applicationProcess"
                value={job.applicationProcess}
                onChange={(e) => handleChange('applicationProcess', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="contactInfo">連絡先</Label>
              <Textarea
                id="contactInfo"
                value={job.contactInfo}
                onChange={(e) => handleChange('contactInfo', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select 
                value={job.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="published">公開中</SelectItem>
                  <SelectItem value="paused">一時停止</SelectItem>
                  <SelectItem value="closed">募集終了</SelectItem>
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
          
          <Link href={`/jobs/${params.id}`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}