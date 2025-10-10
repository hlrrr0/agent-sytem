"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  ArrowLeft, 
  Building2, 
  Edit, 
  MapPin, 
  Phone, 
  Globe, 
  Users,
  Calendar,
  ExternalLink,
  Store,
  Briefcase,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types/company'
import { User } from '@/types/user'

interface CompanyDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  return (
    <ProtectedRoute>
      <CompanyDetailContent params={params} />
    </ProtectedRoute>
  )
}

function CompanyDetailContent({ params }: CompanyDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string>('')
  const [company, setCompany] = useState<Company | null>(null)
  const [consultant, setConsultant] = useState<User | null>(null)
  const [relatedStores, setRelatedStores] = useState<any[]>([])
  const [relatedJobs, setRelatedJobs] = useState<any[]>([])

  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      setCompanyId(resolvedParams.id)
      
      const fetchCompanyData = async () => {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', resolvedParams.id))
          if (companyDoc.exists()) {
            const companyData = companyDoc.data() as Company
            setCompany({ ...companyData, id: resolvedParams.id })
            
            // 担当コンサルタントの取得
            if (companyData.consultantId) {
              const consultantDoc = await getDoc(doc(db, 'users', companyData.consultantId))
              if (consultantDoc.exists()) {
                setConsultant({ ...consultantDoc.data() as User, id: companyData.consultantId })
              }
            }
            
            // 関連店舗の取得
            const storesQuery = query(
              collection(db, 'stores'),
              where('companyId', '==', resolvedParams.id)
            )
            const storesSnapshot = await getDocs(storesQuery)
            const storesData = storesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            setRelatedStores(storesData)
            
            // 関連求人の取得
            const jobsQuery = query(
              collection(db, 'jobs'),
              where('companyId', '==', resolvedParams.id)
            )
            const jobsSnapshot = await getDocs(jobsQuery)
            const jobsData = jobsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            setRelatedJobs(jobsData)
          } else {
            alert('企業が見つかりません')
            router.push('/companies')
          }
        } catch (error) {
          console.error('企業データの取得に失敗しました:', error)
          alert('企業データの取得に失敗しました')
        } finally {
          setLoading(false)
        }
      }

      fetchCompanyData()
    }

    initializeComponent()
  }, [params, router])

  const getStatusBadge = (status: Company['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
    }
    
    const labels = {
      active: '有効',
      suspended: '停止',
      paused: '休止',
    }
    
    return (
      <Badge className={colors[status]}>
        {labels[status]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">企業が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              企業一覧に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(company.status)}
              {company.isPublic && (
                <Badge variant="outline">公開中</Badge>
              )}
            </div>
          </div>
        </div>
        
        <Link href={`/companies/${companyId}/edit`}>
          <Button className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            編集
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本情報 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">企業名</h3>
                  <p className="text-lg">{company.name}</p>
                </div>
                {company.representative && (
                  <div>
                    <h3 className="font-medium text-gray-700">代表者名</h3>
                    <p className="text-lg">{company.representative}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  所在地
                </h3>
                <p className="mt-1">{company.address}</p>
              </div>

              {company.website && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    ウェブサイト
                  </h3>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    従業員数
                  </h3>
                  <p className="mt-1 text-lg">{company.employeeCount || 0}名</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    資本金
                  </h3>
                  <p className="mt-1 text-lg">{company.capital || 0}万円</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    設立年
                  </h3>
                  <p className="mt-1 text-lg">{company.establishedYear || '未設定'}年</p>
                </div>
              </div>

              {/* 会社特徴 */}
              {(company.feature1 || company.feature2 || company.feature3) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">会社特徴</h3>
                    <div className="flex flex-wrap gap-2">
                      {company.feature1 && (
                        <Badge variant="secondary">{company.feature1}</Badge>
                      )}
                      {company.feature2 && (
                        <Badge variant="secondary">{company.feature2}</Badge>
                      )}
                      {company.feature3 && (
                        <Badge variant="secondary">{company.feature3}</Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 管理情報 */}
          <Card>
            <CardHeader>
              <CardTitle>管理情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.contractStartDate && (
                  <div>
                    <h3 className="font-medium text-gray-700">取引開始日</h3>
                    <p className="mt-1">
                      {new Date(company.contractStartDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                
                {consultant && (
                  <div>
                    <h3 className="font-medium text-gray-700">担当コンサルタント</h3>
                    <p className="mt-1 flex items-center gap-2">
                      <span>{consultant.displayName || consultant.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {consultant.role === 'admin' ? '管理者' : 'ユーザー'}
                      </Badge>
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium">作成日時</h3>
                  <p>{new Date(company.createdAt).toLocaleString('ja-JP')}</p>
                </div>
                <div>
                  <h3 className="font-medium">更新日時</h3>
                  <p>{new Date(company.updatedAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 関連店舗 */}
          {relatedStores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  関連店舗 ({relatedStores.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedStores.slice(0, 5).map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{store.name}</h4>
                        <p className="text-sm text-gray-600">{store.address}</p>
                      </div>
                      <Link href={`/stores/${store.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {relatedStores.length > 5 && (
                    <div className="text-center">
                      <Link href={`/stores?company=${companyId}`}>
                        <Button variant="outline">すべての店舗を見る</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 関連求人 */}
          {relatedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  関連求人 ({relatedJobs.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.location}</p>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {relatedJobs.length > 5 && (
                    <div className="text-center">
                      <Link href={`/jobs?company=${companyId}`}>
                        <Button variant="outline">すべての求人を見る</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/companies/${companyId}/edit`}>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  企業情報を編集
                </Button>
              </Link>
              
              <Link href={`/stores/new?company=${companyId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Store className="h-4 w-4 mr-2" />
                  新しい店舗を追加
                </Button>
              </Link>
              
              <Link href={`/jobs/new?company=${companyId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  新しい求人を作成
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                統計情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">店舗数</span>
                  <span className="font-medium">{relatedStores.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">求人数</span>
                  <span className="font-medium">{relatedJobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">公開求人数</span>
                  <span className="font-medium">
                    {relatedJobs.filter(job => job.status === 'published').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">従業員数</span>
                  <span className="font-medium">{company.employeeCount || 0}名</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 企業ロゴ */}
          {company.logo && (
            <Card>
              <CardHeader>
                <CardTitle>企業ロゴ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img 
                    src={company.logo} 
                    alt={`${company.name}のロゴ`}
                    className="max-w-full h-auto max-h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}