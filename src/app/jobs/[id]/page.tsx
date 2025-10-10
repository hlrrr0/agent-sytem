"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Edit,
  ArrowLeft
} from 'lucide-react'
import { getJobById } from '@/lib/firestore/jobs'
import { getCompanyById } from '@/lib/firestore/companies'
import { getStoreById } from '@/lib/firestore/stores'
import { Job, jobStatusLabels, employmentTypeLabels, visibilityLabels } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadJobData(params.id as string)
    }
  }, [params.id])

  const loadJobData = async (jobId: string) => {
    try {
      setIsLoading(true)
      const jobData = await getJobById(jobId)
      
      if (jobData) {
        setJob(jobData)
        
        // 企業と店舗の詳細情報を取得
        const [companyData, storeData] = await Promise.all([
          getCompanyById(jobData.companyId),
          getStoreById(jobData.storeId)
        ])
        
        setCompany(companyData)
        setStore(storeData)
      } else {
        router.push('/jobs')
      }
    } catch (error) {
      console.error('Error loading job data:', error)
      router.push('/jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: Job['status']) => {
    switch (status) {
      case 'active': return 'default'
      case 'draft': return 'secondary'
      case 'paused': return 'outline'
      case 'closed': return 'destructive'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">求人が見つかりませんでした</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {jobStatusLabels[job.status]}
            </Badge>
            <Badge variant="outline">
              {employmentTypeLabels[job.employmentType]}
            </Badge>
            <Badge variant="secondary">
              {visibilityLabels[job.visibility]}
            </Badge>
          </div>
        </div>
        <Link href={`/jobs/${job.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            編集
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                企業・店舗情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">企業名</p>
                  <p className="font-medium">{company?.name || '不明'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">店舗名</p>
                  <p className="font-medium">{store?.name || '不明'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">所在地</p>
                  <p className="font-medium">{store?.address || company?.address || '不明'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">担当者</p>
                  <p className="font-medium">{company?.representative || '不明'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 職務内容 */}
          {job.jobDescription && (
            <Card>
              <CardHeader>
                <CardTitle>職務内容</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{job.jobDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* 求めるスキル */}
          {job.requiredSkills && (
            <Card>
              <CardHeader>
                <CardTitle>求めるスキル</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{job.requiredSkills}</p>
              </CardContent>
            </Card>
          )}

          {/* 勤務条件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                勤務条件
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.workSchedule?.workingHours && (
                <div>
                  <p className="text-sm text-gray-600">勤務時間</p>
                  <p className="font-medium">{job.workSchedule.workingHours}</p>
                </div>
              )}
              
              {job.workSchedule?.shiftType && (
                <div>
                  <p className="text-sm text-gray-600">勤務シフト</p>
                  <p className="font-medium">{job.workSchedule.shiftType}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.workSchedule?.weeklyHolidays && (
                  <div>
                    <p className="text-sm text-gray-600">週休</p>
                    <p className="font-medium">{job.workSchedule.weeklyHolidays}日</p>
                  </div>
                )}
                
                {job.workSchedule?.holidays && (
                  <div>
                    <p className="text-sm text-gray-600">休日詳細</p>
                    <p className="font-medium">{job.workSchedule.holidays}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 福利厚生 */}
          {job.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>福利厚生</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.benefits.socialInsurance && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>社会保険完備</span>
                    </div>
                  )}
                  {job.benefits.uniform && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>制服貸与</span>
                    </div>
                  )}
                  {job.benefits.meals && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>食事補助</span>
                    </div>
                  )}
                  {job.benefits.training && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>研修制度</span>
                    </div>
                  )}
                  {job.benefits.other && job.benefits.other.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">その他の福利厚生:</p>
                      {job.benefits.other.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 給与情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                給与情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.salary.baseSalary && (
                <div>
                  <p className="text-sm text-gray-600">基本給</p>
                  <p className="text-lg font-bold">{job.salary.baseSalary.toLocaleString()}円</p>
                </div>
              )}
              
              {job.salary.housingAllowance && (
                <div>
                  <p className="text-sm text-gray-600">住宅手当</p>
                  <p className="font-medium">{job.salary.housingAllowance.toLocaleString()}円</p>
                </div>
              )}
              
              {job.salary.transportationAllowance?.provided && (
                <div>
                  <p className="text-sm text-gray-600">交通費</p>
                  <p className="font-medium">
                    支給あり
                    {job.salary.transportationAllowance.maxAmount && 
                      ` (上限 ${job.salary.transportationAllowance.maxAmount.toLocaleString()}円)`
                    }
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                {job.salary.commission && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">歩合制あり</span>
                  </div>
                )}
                {job.salary.tips && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">チップ制あり</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 試用期間 */}
          {job.trialPeriod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  試用期間
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">期間</p>
                  <p className="font-medium">{job.trialPeriod.duration}ヶ月</p>
                </div>
                {job.trialPeriod.conditions && (
                  <div>
                    <p className="text-sm text-gray-600">条件</p>
                    <p className="font-medium">{job.trialPeriod.conditions}</p>
                  </div>
                )}
                {job.trialPeriod.salaryDifference && (
                  <div>
                    <p className="text-sm text-gray-600">給与差異</p>
                    <p className="font-medium">{job.trialPeriod.salaryDifference.toLocaleString()}円</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 応募条件 */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  応募条件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.requirements.experienceYears && (
                  <div>
                    <p className="text-sm text-gray-600">経験年数</p>
                    <p className="font-medium">{job.requirements.experienceYears}年以上</p>
                  </div>
                )}
                
                {job.requirements.requiredSkills && job.requirements.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">必要スキル</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.requirements.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.requirements.certifications && job.requirements.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">資格</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.requirements.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.requirements.other && (
                  <div>
                    <p className="text-sm text-gray-600">その他条件</p>
                    <p className="text-sm">{job.requirements.other}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 作成情報 */}
          <Card>
            <CardHeader>
              <CardTitle>作成情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">作成日</p>
                <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">更新日</p>
                <p className="font-medium">{new Date(job.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}