"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, Loader2 } from 'lucide-react'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

interface JobFormProps {
  initialData?: Partial<Job>
  onSubmit: (data: Partial<Job>) => Promise<void>
  isEdit?: boolean
  loading?: boolean
}

export default function JobForm({ 
  initialData = {}, 
  onSubmit, 
  isEdit = false,
  loading = false 
}: JobFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState<Partial<Job>>({
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
    status: 'draft'
  })

  useEffect(() => {
    if (Object.keys(initialData).length > 0 && !loadingData) {
      // 企業・店舗データの読み込みが完了してから初期データを設定
      console.log('JobForm: Setting initial data:', initialData)
      setFormData({
        companyId: initialData.companyId || '',
        storeId: initialData.storeId || 'none',
        title: initialData.title || '',
        businessType: initialData.businessType || '',
        employmentType: initialData.employmentType || '',
        trialPeriod: initialData.trialPeriod || '',
        workingHours: initialData.workingHours || '',
        holidays: initialData.holidays || '',
        overtime: initialData.overtime || '',
        salaryInexperienced: initialData.salaryInexperienced || '',
        salaryExperienced: initialData.salaryExperienced || '',
        requiredSkills: initialData.requiredSkills || '',
        jobDescription: initialData.jobDescription || '',
        smokingPolicy: initialData.smokingPolicy || '',
        insurance: initialData.insurance || '',
        benefits: initialData.benefits || '',
        selectionProcess: initialData.selectionProcess || '',
        consultantReview: initialData.consultantReview || '',
        status: initialData.status || 'draft',
        ...initialData
      })
    }
  }, [initialData, loadingData])

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      try {
        // 動的にFirestoreライブラリをインポート
        const { collection, getDocs, query, where } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        // 企業一覧を取得
        const companiesQuery = query(
          collection(db, 'companies'),
          where('status', '==', 'active')
        )
        const companiesSnapshot = await getDocs(companiesQuery)
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Company))
        
        setCompanies(companiesData)

        // 店舗一覧を取得
        const storesQuery = query(
          collection(db, 'stores'),
          where('status', '==', 'active')
        )
        const storesSnapshot = await getDocs(storesQuery)
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Store))
        
        setStores(storesData)
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // 企業選択時に店舗をフィルタリング
  useEffect(() => {
    if (formData.companyId && formData.companyId !== '') {
      const companyStores = stores.filter(store => store.companyId === formData.companyId)
      setFilteredStores(companyStores)
    } else {
      setFilteredStores([])
    }
  }, [formData.companyId, stores])

  const handleChange = (field: keyof Job, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 雇用形態の複数選択を処理
  const handleEmploymentTypeChange = (employmentType: string, checked: boolean) => {
    const currentTypes = formData.employmentType ? formData.employmentType.split(',').map(t => t.trim()) : []
    
    let updatedTypes: string[]
    if (checked) {
      updatedTypes = [...currentTypes, employmentType]
    } else {
      updatedTypes = currentTypes.filter(type => type !== employmentType)
    }
    
    handleChange('employmentType', updatedTypes.join(', '))
  }

  // 雇用形態が選択されているかチェック
  const isEmploymentTypeSelected = (employmentType: string) => {
    if (!formData.employmentType) return false
    const currentTypes = formData.employmentType.split(',').map(t => t.trim())
    return currentTypes.includes(employmentType)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !formData.title) {
      alert('企業と職種名は必須項目です')
      return
    }

    await onSubmit(formData)
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">データを読み込み中...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>求人の基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">求人ステータス *</Label>
            <Select 
              value={formData.status || 'draft'} 
              onValueChange={(value) => handleChange('status', value as Job['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="active">募集中</SelectItem>
                <SelectItem value="closed">募集終了</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="companyId">企業 *</Label>
                <Select 
                value={formData.companyId || ''} 
                onValueChange={(value) => {
                    handleChange('companyId', value)
                    // 企業変更時は店舗もリセット
                    handleChange('storeId', 'none')
                }}
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
                value={formData.storeId || 'none'} 
                onValueChange={(value) => handleChange('storeId', value === 'none' ? undefined : value)}
                >
                <SelectTrigger>
                    <SelectValue placeholder="店舗を選択してください（任意）" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">店舗を指定しない</SelectItem>
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
            <Label htmlFor="title">職種名 *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="例: 寿司職人"
              required
            />
          </div>

          <div>
            <Label>雇用形態 (複数選択可)</Label>
            <div className="space-y-2 mt-2">
              {['正社員', '契約社員', 'アルバイト'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`employment-${type}`}
                    checked={isEmploymentTypeSelected(type)}
                    onCheckedChange={(checked) => handleEmploymentTypeChange(type, checked as boolean)}
                  />
                  <Label htmlFor={`employment-${type}`} className="text-sm font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

 {/* 職務・スキル */}
      <Card>
        <CardHeader>
          <CardTitle>職務・スキル</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobDescription">職務内容</Label>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription || ''}
              onChange={(e) => handleChange('jobDescription', e.target.value)}
              rows={6}
              placeholder="例: 寿司の握り、仕込み作業、接客対応"
            />
          </div>
          <div>
            <Label htmlFor="requiredSkills">求めるスキル</Label>
            <Textarea
              id="requiredSkills"
              value={formData.requiredSkills || ''}
              onChange={(e) => handleChange('requiredSkills', e.target.value)}
              rows={4}
              placeholder="例: 寿司作りの基本技術、接客経験"
            />
          </div>


        </CardContent>
      </Card>

      {/* 勤務条件 */}
      <Card>
        <CardHeader>
          <CardTitle>勤務条件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="trialPeriod">試用期間</Label>
                <Input
                id="trialPeriod"
                value={formData.trialPeriod || ''}
                onChange={(e) => handleChange('trialPeriod', e.target.value)}
                placeholder="例: 3ヶ月"
                />
            </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="workingHours">勤務時間</Label>
                    <Textarea
                    id="workingHours"
                    value={formData.workingHours || ''}
                    onChange={(e) => handleChange('workingHours', e.target.value)}
                    rows={3}
                    placeholder="例: 10:00〜22:00（実働8時間、休憩2時間）"
                    />
                </div>

                <div>
                <Label htmlFor="holidays">休日・休暇</Label>
                <Textarea
                    id="holidays"
                    value={formData.holidays || ''}
                    onChange={(e) => handleChange('holidays', e.target.value)}
                    rows={3}
                    placeholder="例: 週休2日制、年間休日120日"
                />
                </div>
            </div>
          <div>
            <Label htmlFor="overtime">時間外労働</Label>
            <Textarea
              id="overtime"
              value={formData.overtime || ''}
              onChange={(e) => handleChange('overtime', e.target.value)}
              rows={2}
              placeholder="例: 月平均20時間程度"
            />
          </div>
        </CardContent>
      </Card>

      {/* 給与情報 */}
      <Card>
        <CardHeader>
          <CardTitle>給与情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="salaryInexperienced">給与（未経験）</Label>
            <Textarea
              id="salaryInexperienced"
              value={formData.salaryInexperienced || ''}
              onChange={(e) => handleChange('salaryInexperienced', e.target.value)}
              rows={3}
              placeholder="例: 月給25万円〜（昇給あり）"
            />
          </div>

          <div>
            <Label htmlFor="salaryExperienced">給与（経験者）</Label>
            <Textarea
              id="salaryExperienced"
              value={formData.salaryExperienced || ''}
              onChange={(e) => handleChange('salaryExperienced', e.target.value)}
              rows={3}
              placeholder="例: 月給30万円〜（経験・能力を考慮）"
            />
          </div>
        </CardContent>
      </Card>

      {/* 職場環境・福利厚生 */}
      <Card>
        <CardHeader>
          <CardTitle>職場環境・福利厚生</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="smokingPolicy">受動喫煙防止措置</Label>
            <Textarea
              id="smokingPolicy"
              value={formData.smokingPolicy || ''}
              onChange={(e) => handleChange('smokingPolicy', e.target.value)}
              rows={2}
              placeholder="例: 店内全面禁煙"
            />
          </div>

          <div>
            <Label htmlFor="insurance">加入保険</Label>
            <Textarea
              id="insurance"
              value={formData.insurance || ''}
              onChange={(e) => handleChange('insurance', e.target.value)}
              rows={2}
              placeholder="例: 社会保険完備（健康保険、厚生年金、雇用保険、労災保険）"
            />
          </div>

          <div>
            <Label htmlFor="benefits">待遇・福利厚生</Label>
            <Textarea
              id="benefits"
              value={formData.benefits || ''}
              onChange={(e) => handleChange('benefits', e.target.value)}
              rows={4}
              placeholder="例: 交通費支給、制服貸与、食事補助"
            />
          </div>
        </CardContent>
      </Card>

      {/* 選考・その他 */}
      <Card>
        <CardHeader>
          <CardTitle>選考・その他</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="selectionProcess">選考プロセス</Label>
            <Textarea
              id="selectionProcess"
              value={formData.selectionProcess || ''}
              onChange={(e) => handleChange('selectionProcess', e.target.value)}
              rows={4}
              placeholder="例: 書類選考 → 面接 → 実技試験"
            />
          </div>

          <div>
            <Label htmlFor="consultantReview">キャリア担当からの&quot;正直な&quot;感想</Label>
            <Textarea
              id="consultantReview"
              value={formData.consultantReview || ''}
              onChange={(e) => handleChange('consultantReview', e.target.value)}
              rows={4}
              placeholder="この求人についてのキャリア担当者からの率直な意見や感想"
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? '更新中...' : '保存中...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? '求人を更新' : '求人を追加'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}