"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createJob } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'
import { getStores } from '@/lib/firestore/stores'
import { Job, employmentTypeLabels, visibilityLabels, jobStatusLabels } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

export default function NewJobPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  
  const [formData, setFormData] = useState({
    // 基本情報
    companyId: '',
    storeId: '',
    title: '',
    employmentType: 'full-time' as Job['employmentType'],
    jobDescription: '',
    requiredSkills: '',
    
    // 給与情報
    baseSalary: '',
    commission: false,
    tips: false,
    housingAllowance: '',
    transportationProvided: false,
    transportationMaxAmount: '',
    
    // 勤務情報
    workingHours: '',
    shiftType: '',
    weeklyHolidays: '',
    holidays: '',
    
    // 試用期間
    trialDuration: '',
    trialConditions: '',
    trialSalaryDifference: '',
    
    // 福利厚生
    socialInsurance: false,
    uniform: false,
    meals: false,
    training: false,
    otherBenefits: '',
    
    // 応募条件
    experienceYears: '',
    requiredSkillsList: '',
    certifications: '',
    languages: '',
    otherRequirements: '',
    
    // 公開設定
    visibility: 'public' as Job['visibility'],
    status: 'draft' as Job['status']
  })

  useEffect(() => {
    loadCompaniesAndStores()
  }, [])

  useEffect(() => {
    if (formData.companyId) {
      const companyStores = stores.filter(store => store.companyId === formData.companyId)
      setFilteredStores(companyStores)
      setFormData(prev => ({ ...prev, storeId: '' }))
    } else {
      setFilteredStores([])
    }
  }, [formData.companyId, stores])

  const loadCompaniesAndStores = async () => {
    try {
      const [companiesData, storesData] = await Promise.all([
        getCompanies(),
        getStores()
      ])
      setCompanies(companiesData)
      setStores(storesData)
    } catch (error) {
      console.error('Error loading companies and stores:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !formData.storeId || !formData.title) {
      alert('企業、店舗、求人タイトルは必須です')
      return
    }

    setIsLoading(true)

    try {
      const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: formData.companyId,
        storeId: formData.storeId,
        title: formData.title,
        employmentType: formData.employmentType,
        jobDescription: formData.jobDescription || undefined,
        requiredSkills: formData.requiredSkills || undefined,
        
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
        
        trialPeriod: formData.trialDuration ? {
          duration: parseInt(formData.trialDuration),
          conditions: formData.trialConditions || undefined,
          salaryDifference: formData.trialSalaryDifference ? parseInt(formData.trialSalaryDifference) : undefined
        } : undefined,
        
        benefits: {
          socialInsurance: formData.socialInsurance,
          uniform: formData.uniform,
          meals: formData.meals,
          training: formData.training,
          other: formData.otherBenefits ? formData.otherBenefits.split(',').map(s => s.trim()) : undefined
        },
        
        requirements: {
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
          requiredSkills: formData.requiredSkillsList ? formData.requiredSkillsList.split(',').map(s => s.trim()) : undefined,
          certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()) : undefined,
          languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : undefined,
          other: formData.otherRequirements || undefined
        },
        
        visibility: formData.visibility,
        status: formData.status
      }

      await createJob(jobData)
      router.push('/jobs')
    } catch (error) {
      console.error('Error creating job:', error)
      alert('求人の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>新規求人作成</CardTitle>
          <CardDescription>新しい求人情報を作成します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">企業 *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => handleInputChange('companyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="企業を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeId">店舗 *</Label>
                  <Select
                    value={formData.storeId}
                    onValueChange={(value) => handleInputChange('storeId', value)}
                    disabled={!formData.companyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="店舗を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">求人タイトル *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: ホールスタッフ募集"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentType">雇用形態</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value: Job['employmentType']) => handleInputChange('employmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">正社員</SelectItem>
                      <SelectItem value="contract">契約社員</SelectItem>
                      <SelectItem value="part-time">アルバイト</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">職務内容</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  placeholder="職務内容を詳しく記入してください"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredSkills">求めるスキル</Label>
                <Textarea
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => handleInputChange('requiredSkills', e.target.value)}
                  placeholder="握り、仕込み、焼き、接客、衛生管理など"
                  rows={3}
                />
              </div>
            </div>

            {/* 給与情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">給与情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">基本給（円）</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                    placeholder="250000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="housingAllowance">住宅手当（円）</Label>
                  <Input
                    id="housingAllowance"
                    type="number"
                    value={formData.housingAllowance}
                    onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                    placeholder="20000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportationMaxAmount">交通費上限（円）</Label>
                  <Input
                    id="transportationMaxAmount"
                    type="number"
                    value={formData.transportationMaxAmount}
                    onChange={(e) => handleInputChange('transportationMaxAmount', e.target.value)}
                    placeholder="15000"
                    disabled={!formData.transportationProvided}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="commission"
                    checked={formData.commission}
                    onCheckedChange={(checked) => handleInputChange('commission', checked)}
                  />
                  <Label htmlFor="commission">歩合制あり</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tips"
                    checked={formData.tips}
                    onCheckedChange={(checked) => handleInputChange('tips', checked)}
                  />
                  <Label htmlFor="tips">チップ制あり</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportationProvided"
                    checked={formData.transportationProvided}
                    onCheckedChange={(checked) => handleInputChange('transportationProvided', checked)}
                  />
                  <Label htmlFor="transportationProvided">交通費支給</Label>
                </div>
              </div>
            </div>

            {/* ステータス・公開設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">公開設定</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">ステータス</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Job['status']) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">下書き</SelectItem>
                      <SelectItem value="active">募集中</SelectItem>
                      <SelectItem value="paused">一時停止</SelectItem>
                      <SelectItem value="closed">募集終了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">公開設定</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: Job['visibility']) => handleInputChange('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">非公開（指名型）</SelectItem>
                      <SelectItem value="limited">限定公開</SelectItem>
                      <SelectItem value="public">公開</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/jobs')}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '作成中...' : '求人を作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}