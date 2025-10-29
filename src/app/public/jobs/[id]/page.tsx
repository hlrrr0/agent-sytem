"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Building2,
  Store,
  Phone,
  Globe,
  Mail,
  Users,
  Camera,
  Star,
  Calendar
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { Store as StoreType } from '@/types/store'

interface PublicJobPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PublicJobPage({ params }: PublicJobPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobId, setJobId] = useState<string>('')
  const [job, setJob] = useState<Job | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [store, setStore] = useState<StoreType | null>(null)
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      setJobId(resolvedParams.id)
      
      const fetchJobData = async () => {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', resolvedParams.id))
          if (jobDoc.exists()) {
            const jobData = jobDoc.data() as Job
            
            // 公開中の求人のみ表示
            if (jobData.status !== 'active') {
              setJob(null)
              setLoading(false)
              return
            }
            
            setJob({ ...jobData, id: resolvedParams.id })
            
            // 関連企業の取得
            if (jobData.companyId) {
              const companyDoc = await getDoc(doc(db, 'companies', jobData.companyId))
              if (companyDoc.exists()) {
                setCompany({ ...companyDoc.data() as Company, id: jobData.companyId })
              }
            }
            
            // 関連店舗の取得
            if (jobData.storeId) {
              const storeDoc = await getDoc(doc(db, 'stores', jobData.storeId))
              if (storeDoc.exists()) {
                setStore({ ...storeDoc.data() as StoreType, id: jobData.storeId })
              }
            }
          } else {
            setJob(null)
          }
        } catch (error) {
          console.error('求人データの取得に失敗しました:', error)
          setJob(null)
        } finally {
          setLoading(false)
        }
      }

      fetchJobData()
    }

    initializeComponent()
  }, [params, router])

  // 日時をフォーマットする関数
  const formatDateTime = (dateValue: any) => {
    if (!dateValue) return '未設定'
    
    try {
      let date: Date
      
      if (dateValue && typeof dateValue.toDate === 'function') {
        // Firestore Timestamp
        date = dateValue.toDate()
      } else if (dateValue instanceof Date) {
        // Date オブジェクト
        date = dateValue
      } else if (typeof dateValue === 'string') {
        // 文字列
        date = new Date(dateValue)
      } else {
        return '不正な日時'
      }
      
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      console.error('日時のフォーマットに失敗:', error)
      return '不正な日時'
    }
  }

  const getEmploymentTypeBadge = (type: Job['employmentType']) => {
    if (!type) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          未設定
        </Badge>
      )
    }

    const colors = {
      'full-time': 'bg-blue-100 text-blue-800',
      'part-time': 'bg-purple-100 text-purple-800',
      'contract': 'bg-orange-100 text-orange-800',
      'temporary': 'bg-pink-100 text-pink-800',
      'intern': 'bg-green-100 text-green-800',
    }
    
    const labels = {
      'full-time': '正社員',
      'part-time': 'アルバイト・パート',
      'contract': '契約社員',
      'temporary': '派遣社員',
      'intern': 'インターン',
    }

    // 定義されていない雇用形態の場合は、文字列をそのまま表示
    const displayColor = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    const displayLabel = labels[type as keyof typeof labels] || type
    
    return (
      <Badge className={displayColor}>
        {displayLabel}
      </Badge>
    )
  }

  const formatSalary = (job: Job) => {
    if (job.salaryExperienced) {
      return `給与（経験者）: ${job.salaryExperienced}`
    } else if (job.salaryInexperienced) {
      return `給与（未経験）: ${job.salaryInexperienced}`
    }
    return '給与: 要相談'
  }

  const handleImageClick = (imageUrl: string, alt: string) => {
    setModalImage({ src: imageUrl, alt })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-600">読み込み中...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">求人が見つかりません</h1>
          <p className="text-gray-600">この求人は現在公開されていないか、存在しません。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 求人基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  {job.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">募集中</Badge>
                  {getEmploymentTypeBadge(job.employmentType)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">職種</h3>
                    <p className="text-lg">{job.title}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      給与
                    </h3>
                    <p className="text-lg">{formatSalary(job)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    勤務地
                  </h3>
                  <p className="mt-1">{store?.name || company?.name || '勤務地情報なし'}</p>
                  {store?.address && (
                    <p className="text-gray-600 text-sm mt-1">{store.address}</p>
                  )}
                </div>

                {/* 業態 */}
                {job.businessType && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">業態</h3>
                      <p className="mt-1">{job.businessType}</p>
                    </div>
                  </>
                )}

                {/* 職務内容 */}
                {job.jobDescription && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">職務内容</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.jobDescription}</p>
                    </div>
                  </>
                )}

                {/* 求めるスキル */}
                {job.requiredSkills && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">求めるスキル</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.requiredSkills}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 勤務条件 */}
            <Card>
              <CardHeader>
                <CardTitle>勤務条件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 試用期間 */}
                {job.trialPeriod && (
                  <div>
                    <h3 className="font-medium text-gray-700">試用期間</h3>
                    <p className="mt-1">{job.trialPeriod}</p>
                  </div>
                )}

                {/* 勤務時間 */}
                {job.workingHours && (
                  <>
                    {job.trialPeriod && <Separator />}
                    <div>
                      <h3 className="font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        勤務時間
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.workingHours}</p>
                    </div>
                  </>
                )}

                {/* 休日・休暇 */}
                {job.holidays && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        休日・休暇
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.holidays}</p>
                    </div>
                  </>
                )}

                {/* 時間外労働 */}
                {job.overtime && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">時間外労働</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.overtime}</p>
                    </div>
                  </>
                )}

                {/* 待遇・福利厚生 */}
                {job.benefits && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">待遇・福利厚生</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.benefits}</p>
                    </div>
                  </>
                )}

                {/* 受動喫煙防止措置 */}
                {job.smokingPolicy && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">受動喫煙防止措置</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.smokingPolicy}</p>
                    </div>
                  </>
                )}

                {/* 加入保険 */}
                {job.insurance && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-700">加入保険</h3>
                      <p className="mt-1 whitespace-pre-wrap">{job.insurance}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 選考プロセス */}
            {job.selectionProcess && (
              <Card>
                <CardHeader>
                  <CardTitle>選考プロセス</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{job.selectionProcess}</p>
                </CardContent>
              </Card>
            )}

            {/* コンサルタントのコメント */}
            {job.consultantReview && (
              <Card>
                <CardHeader>
                  <CardTitle>コンサルタントからのコメント</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-blue-800">{job.consultantReview}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 企業情報 */}
            {company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    企業情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{company.name}</h3>
                    {company.address && (
                      <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        {company.address}
                      </p>
                    )}
                  </div>
                  
                  {/* 企業の基本情報 */}
                  <div className="space-y-2">
                    {company.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {company.phone}
                      </p>
                    )}
                    
                    {company.website && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          企業ウェブサイト
                        </a>
                      </p>
                    )}

                    {company.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {company.email}
                      </p>
                    )}

                    {company.establishedYear && (
                      <p className="text-sm text-gray-600">
                        設立年: {company.establishedYear}年
                      </p>
                    )}

                    {company.employeeCount && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        従業員数: {company.employeeCount}名
                      </p>
                    )}

                    {company.capital && (
                      <p className="text-sm text-gray-600">
                        資本金: {company.capital}円
                      </p>
                    )}
                  </div>

                  {/* 企業特徴 */}
                  {(company.feature1 || company.feature2 || company.feature3) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">企業特徴</h4>
                        <div className="space-y-1">
                          {company.feature1 && (
                            <p className="text-sm text-gray-600">• {company.feature1}</p>
                          )}
                          {company.feature2 && (
                            <p className="text-sm text-gray-600">• {company.feature2}</p>
                          )}
                          {company.feature3 && (
                            <p className="text-sm text-gray-600">• {company.feature3}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* キャリアパス */}
                  {company.careerPath && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">目指せるキャリア</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{company.careerPath}</p>
                      </div>
                    </>
                  )}

                  {/* 若手入社理由 */}
                  {company.youngRecruitReason && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">若手の入社理由</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{company.youngRecruitReason}</p>
                      </div>
                    </>
                  )}

                  {/* 企業画像 */}
                  {company.logo && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          企業ロゴ
                        </h4>
                        <img
                          src={company.logo}
                          alt="企業ロゴ"
                          className="w-full max-w-xs h-auto rounded-lg cursor-pointer border"
                          onClick={() => handleImageClick(company.logo!, '企業ロゴ')}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 店舗情報 */}
            {store && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    店舗情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{store.name}</h3>
                    {store.address && (
                      <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        {store.address}
                      </p>
                    )}
                  </div>

                  {/* 店舗基本情報 */}
                  <div className="space-y-2">
                    {store.nearestStation && (
                      <p className="text-sm text-gray-600">
                        🚉 最寄り駅: {store.nearestStation}
                      </p>
                    )}

                    {store.website && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          店舗ウェブサイト
                        </a>
                      </p>
                    )}

                    {store.seatCount && (
                      <p className="text-sm text-gray-600">
                        座席数: {store.seatCount}席
                      </p>
                    )}

                    {store.unitPrice && (
                      <p className="text-sm text-gray-600">
                        客単価: {store.unitPrice}円
                      </p>
                    )}

                    {store.isReservationRequired !== undefined && (
                      <p className="text-sm text-gray-600">
                        予約: {store.isReservationRequired ? '必要' : '不要'}
                      </p>
                    )}
                  </div>

                  {/* SNS・口コミ情報 */}
                  <div className="space-y-2">
                    {store.instagramUrl && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        📷 <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Instagram
                        </a>
                      </p>
                    )}

                    {store.tabelogUrl && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        🍽️ <a href={store.tabelogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          食べログ
                        </a>
                      </p>
                    )}

                    {store.googleReviewScore && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Google口コミスコア: {store.googleReviewScore}
                      </p>
                    )}

                    {store.tabelogScore && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        食べログスコア: {store.tabelogScore}
                      </p>
                    )}
                  </div>

                  {/* 評判・その他情報 */}
                  {store.reputation && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">その他 / ミシュランなどの獲得状況等の実績</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{store.reputation}</p>
                      </div>
                    </>
                  )}

                  {store.staffReview && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">スタッフからの評価</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{store.staffReview}</p>
                      </div>
                    </>
                  )}

                  {store.trainingPeriod && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">研修期間</h4>
                        <p className="text-sm text-gray-600">{store.trainingPeriod}</p>
                      </div>
                    </>
                  )}

                  {/* 店舗画像 */}
                  <div className="space-y-4">
                    {store.ownerPhoto && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            オーナー写真
                          </h4>
                          <img
                            src={store.ownerPhoto}
                            alt="オーナー写真"
                            className="w-full max-w-xs h-auto rounded-lg cursor-pointer border"
                            onClick={() => handleImageClick(store.ownerPhoto!, 'オーナー写真')}
                          />
                        </div>
                      </>
                    )}

                    {store.interiorPhoto && (
                      <>
                        {!store.ownerPhoto && <Separator />}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            店内写真
                          </h4>
                          <img
                            src={store.interiorPhoto}
                            alt="店内写真"
                            className="w-full h-auto rounded-lg cursor-pointer border"
                            onClick={() => handleImageClick(store.interiorPhoto!, '店内写真')}
                          />
                        </div>
                      </>
                    )}

                    {/* 素材写真 */}
                    {[store.photo1, store.photo2, store.photo3, store.photo4, store.photo5, store.photo6, store.photo7].some(photo => photo) && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            素材写真
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { src: store.photo1, alt: '素材写真1' },
                              { src: store.photo2, alt: '素材写真2' },
                              { src: store.photo3, alt: '素材写真3' },
                              { src: store.photo4, alt: '素材写真4' },
                              { src: store.photo5, alt: '素材写真5' },
                              { src: store.photo6, alt: '素材写真6' },
                              { src: store.photo7, alt: '素材写真7' }
                            ].map((photo, index) => (
                              photo.src && (
                                <img
                                  key={index}
                                  src={photo.src}
                                  alt={photo.alt}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer border hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(photo.src!, photo.alt)}
                                />
                              )
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* オーナー動画 */}
                    {store.ownerVideo && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">オーナー動画</h4>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <a
                              href={store.ownerVideo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              動画を視聴する
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 応募について */}
            <Card>
              <CardHeader>
                <CardTitle>応募について</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    この求人への応募については、弊社の人材紹介サービスを通じて行います。
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      応募をご希望の方は、お気軽にお問い合わせください。
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    掲載日: {formatDateTime(job.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 画像モーダル */}
        <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{modalImage?.alt}</DialogTitle>
            </DialogHeader>
            {modalImage && (
              <div className="flex justify-center">
                <img
                  src={modalImage.src}
                  alt={modalImage.alt}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}