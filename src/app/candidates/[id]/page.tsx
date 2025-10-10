"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react'
import { Candidate, candidateStatusLabels } from '@/types/candidate'
import { getCandidateById, deleteCandidate } from '@/lib/firestore/candidates'
import { toast } from 'sonner'

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (candidateId) {
      loadCandidate()
    }
  }, [candidateId])

  const loadCandidate = async () => {
    try {
      setLoading(true)
      const candidateData = await getCandidateById(candidateId)
      if (candidateData) {
        setCandidate(candidateData)
      } else {
        toast.error('求職者が見つかりません')
        router.push('/candidates')
      }
    } catch (error) {
      console.error('Error loading candidate:', error)
      toast.error('求職者データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!candidate) return
    
    const fullName = `${candidate.firstName} ${candidate.lastName}`
    if (!confirm(`「${fullName}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      await deleteCandidate(candidate.id)
      toast.success('求職者を削除しました')
      router.push('/candidates')
    } catch (error) {
      console.error('Error deleting candidate:', error)
      toast.error('求職者の削除に失敗しました')
    }
  }

  const getStatusBadge = (status: Candidate['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      placed: 'default',
      interviewing: 'outline'
    } as const

    return (
      <Badge variant={variants[status]}>
        {candidateStatusLabels[status]}
      </Badge>
    )
  }

  const getExperienceYears = (experience: any[]) => {
    const totalYears = experience.reduce((total, exp) => {
      const startDate = new Date(exp.startDate)
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      return total + years
    }, 0)
    
    return Math.floor(totalYears)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">求職者が見つかりません</h1>
          <Link href="/candidates">
            <Button className="mt-4">求職者一覧に戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const fullNameKana = `${candidate.firstNameKana} ${candidate.lastNameKana}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              {fullName}
            </h1>
            <p className="text-gray-600 mt-1">{fullNameKana}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/candidates/${candidate.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              編集
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">氏名</label>
                  <p className="text-lg">{fullName}</p>
                  <p className="text-sm text-gray-500">{fullNameKana}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">ステータス</label>
                  <div className="mt-1">
                    {getStatusBadge(candidate.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">メールアドレス</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{candidate.email}</span>
                  </div>
                </div>

                {candidate.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">電話番号</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{candidate.phone}</span>
                    </div>
                  </div>
                )}

                {candidate.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">生年月日</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(candidate.dateOfBirth)}</span>
                    </div>
                  </div>
                )}

                {candidate.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">性別</label>
                    <p className="mt-1">{candidate.gender}</p>
                  </div>
                )}
              </div>

              {candidate.enrollmentMonth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">飲食人大学</label>
                  <p className="mt-1">
                    {candidate.enrollmentMonth}入学
                    {candidate.campus && ` / ${candidate.campus}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 職歴 */}
          {candidate.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  職歴 ({getExperienceYears(candidate.experience)}年の経験)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.experience.map((exp, index) => (
                    <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{exp.position}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : '現在'}
                        </span>
                      </div>
                      <p className="text-gray-600">{exp.company}</p>
                      {exp.description && (
                        <p className="text-sm text-gray-500 mt-2">{exp.description}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                          {exp.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 学歴 */}
          {candidate.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  学歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{edu.degree}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : '在学中'}
                        </span>
                      </div>
                      <p className="text-gray-600">{edu.school}</p>
                      <p className="text-sm text-gray-500">{edu.field}</p>
                      {edu.gpa && (
                        <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {/* スキル */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                スキル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 資格 */}
          {candidate.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  資格・免許
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidate.certifications.map((cert, index) => (
                    <div key={cert.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                      <h4 className="font-medium">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      <p className="text-sm text-gray-500">
                        取得日: {formatDate(cert.dateIssued)}
                      </p>
                      {cert.expiryDate && (
                        <p className="text-sm text-gray-500">
                          有効期限: {formatDate(cert.expiryDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 希望条件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                希望条件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidate.preferences.workLocation && candidate.preferences.workLocation.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">希望勤務地</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.preferences.workLocation.map((location, index) => (
                        <Badge key={index} variant="outline">{location}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.preferences.salary && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">希望給与</label>
                    <p className="mt-1">
                      {candidate.preferences.salary.min && `${candidate.preferences.salary.min.toLocaleString()}円`}
                      {candidate.preferences.salary.min && candidate.preferences.salary.max && ' - '}
                      {candidate.preferences.salary.max && `${candidate.preferences.salary.max.toLocaleString()}円`}
                    </p>
                  </div>
                )}

                {candidate.preferences.workStyle && candidate.preferences.workStyle.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">希望勤務形態</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.preferences.workStyle.map((style, index) => (
                        <Badge key={index} variant="outline">{style}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* コメント */}
          {(candidate.consultantComment || candidate.instructorComment) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  コメント
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.consultantComment && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">コンサル紹介文</label>
                    <p className="mt-1 text-sm">{candidate.consultantComment}</p>
                  </div>
                )}
                {candidate.instructorComment && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">講師コメント</label>
                    <p className="mt-1 text-sm">{candidate.instructorComment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 書類リンク */}
          {(candidate.resumeUrl || candidate.portfolioUrl || candidate.workHistoryUrl || candidate.recommendationUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  書類
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidate.resumeUrl && (
                  <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    履歴書
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    ポートフォリオ
                  </a>
                )}
                {candidate.workHistoryUrl && (
                  <a href={candidate.workHistoryUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    職務経歴書
                  </a>
                )}
                {candidate.recommendationUrl && (
                  <a href={candidate.recommendationUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    推薦状
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* メタデータ */}
          <Card>
            <CardHeader>
              <CardTitle>メタデータ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">作成日:</span> {formatDate(candidate.createdAt)}
              </div>
              <div>
                <span className="text-gray-500">更新日:</span> {formatDate(candidate.updatedAt)}
              </div>
              {candidate.lastContactDate && (
                <div>
                  <span className="text-gray-500">最終連絡日:</span> {formatDate(candidate.lastContactDate)}
                </div>
              )}
              {candidate.assignedRecruiter && (
                <div>
                  <span className="text-gray-500">担当者:</span> {candidate.assignedRecruiter}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}