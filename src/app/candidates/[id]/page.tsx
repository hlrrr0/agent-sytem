"use client"

import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Users, Edit, TrendingUp, Briefcase, Building, Eye, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Candidate } from '@/types/candidate'
import { Match } from '@/types/matching'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { getMatchesByCandidate } from '@/lib/firestore/matches'
import { getJob } from '@/lib/firestore/jobs'
import { getCompany } from '@/lib/firestore/companies'

const statusLabels = {
  suggested: '提案済み',
  interested: '興味あり',
  applied: '応募済み',
  interviewing: '面接中',
  offered: '内定',
  accepted: '受諾',
  rejected: '不合格',
  withdrawn: '辞退'
}

const statusColors = {
  suggested: 'bg-blue-100 text-blue-800',
  interested: 'bg-yellow-100 text-yellow-800',
  applied: 'bg-purple-100 text-purple-800',
  interviewing: 'bg-orange-100 text-orange-800',
  offered: 'bg-green-100 text-green-800',
  accepted: 'bg-green-600 text-white',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800'
}

interface MatchWithDetails extends Match {
  jobTitle?: string
  companyName?: string
}

interface CandidateDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [candidateId, setCandidateId] = useState<string>('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [matches, setMatches] = useState<MatchWithDetails[]>([])

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setCandidateId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!candidateId) return

    const fetchCandidate = async () => {
      try {
        const candidateDoc = await getDoc(doc(db, 'candidates', candidateId))
        if (candidateDoc.exists()) {
          const candidateData = candidateDoc.data() as Candidate
          setCandidate(candidateData)
        } else {
          alert('求職者が見つかりません')
          router.push('/candidates')
        }
      } catch (error) {
        console.error('求職者データの取得に失敗しました:', error)
        alert('求職者データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidate()
  }, [candidateId, router])

  useEffect(() => {
    if (!candidateId) return
    loadMatches()
  }, [candidateId])

  const loadMatches = async () => {
    try {
      setMatchesLoading(true)
      console.log('🔍 候補者のマッチング読み込み開始 ID:', candidateId)
      
      // 候補者のマッチングを取得
      const matchesData = await getMatchesByCandidate(candidateId)
      console.log('📋 取得したマッチング数:', matchesData.length)
      
      // 各マッチングに求人と企業の詳細情報を追加
      const matchesWithDetails = await Promise.all(
        matchesData.map(async (match) => {
          try {
            const [jobData, companyData] = await Promise.all([
              getJob(match.jobId),
              getCompany(match.companyId)
            ])
            
            return {
              ...match,
              jobTitle: jobData?.title || '求人不明',
              companyName: companyData?.name || '企業不明'
            }
          } catch (error) {
            console.error('マッチング詳細取得エラー:', error)
            return {
              ...match,
              jobTitle: '取得エラー',
              companyName: '取得エラー'
            }
          }
        })
      )
      
      setMatches(matchesWithDetails)
      console.log('✅ マッチング詳細読み込み完了')
    } catch (error) {
      console.error('マッチング読み込みエラー:', error)
    } finally {
      setMatchesLoading(false)
    }
  }

  const getStatusBadge = (status: Match['status']) => (
    <Badge className={`${statusColors[status]} border-0 font-medium`}>
      {statusLabels[status]}
    </Badge>
  )

  const getScoreBadge = (score: number) => {
    let colorClass = 'bg-gray-100 text-gray-800'
    if (score >= 90) colorClass = 'bg-green-100 text-green-800'
    else if (score >= 80) colorClass = 'bg-blue-100 text-blue-800'
    else if (score >= 70) colorClass = 'bg-yellow-100 text-yellow-800'
    else if (score >= 60) colorClass = 'bg-orange-100 text-orange-800'
    else colorClass = 'bg-red-100 text-red-800'

    return (
      <Badge className={`${colorClass} border-0 font-medium`}>
        {score}%
      </Badge>
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">求職者が見つかりません</div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
        <Link href="/candidates">
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-800">
            <Users className="h-8 w-8" />
            求職者詳細
          </h1>
          <p className="text-gray-600 mt-2">
            {candidate.firstName} {candidate.lastName}の詳細情報
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadMatches}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Link href={`/candidates/${candidateId}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* 基本情報セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-800">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">氏名</label>
                <p className="text-lg">{candidate.firstName} {candidate.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">氏名（カナ）</label>
                <p>{candidate.firstNameKana} {candidate.lastNameKana}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">メールアドレス</label>
                <p>{candidate.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">電話番号</label>
                <p>{candidate.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">生年月日</label>
                <p>{candidate.dateOfBirth instanceof Date ? candidate.dateOfBirth.toLocaleDateString() : candidate.dateOfBirth}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-800">スキル・資格</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">スキル</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {candidate.skills?.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    )) || <span className="text-gray-500">未登録</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">資格</label>
                  <div className="space-y-1 mt-1">
                    {candidate.certifications?.map((cert, index) => (
                      <p key={index} className="text-sm">{typeof cert === 'string' ? cert : cert.name}</p>
                    )) || <span className="text-gray-500">未登録</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* マッチング進捗セクション */}
        <Card className="border-purple-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  マッチング進捗
                </CardTitle>
                <CardDescription>
                  この候補者のマッチング状況と進捗
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  {matches.length}件
                </Badge>
                {matchesLoading && <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {matchesLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">マッチング情報を読み込み中...</p>
              </div>
            ) : matches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>求人</TableHead>
                    <TableHead>企業</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id} className="hover:bg-purple-50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="font-medium">{match.jobTitle}</div>
                            {match.matchReasons.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {match.matchReasons.slice(0, 2).map((reason, index) => (
                                  <span key={index} className="mr-2">
                                    {reason.description}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{match.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(match.score)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(match.status)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(match.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <Link href={`/progress/${match.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Link href={`/jobs/${match.jobId}`}>
                              <Briefcase className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  マッチングがありません
                </h3>
                <p className="text-gray-600 mb-4">
                  この候補者にはまだマッチングが作成されていません
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/progress">
                    進捗管理でマッチングを作成
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </ProtectedRoute>
  )
}