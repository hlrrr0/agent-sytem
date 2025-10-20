"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp,
  Plus, 
  Search, 
  Users,
  User,
  Briefcase,
  Calendar,
  Eye,
  Edit,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Match, MatchReason, MatchTimeline } from '@/types/matching'
import { Candidate } from '@/types/candidate'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { getMatches, getMatchStats, updateMatchStatus, createMatch } from '@/lib/firestore/matches'
import { getCandidates } from '@/lib/firestore/candidates'
import { getJobs } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

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
  candidateName?: string
  jobTitle?: string
  companyName?: string
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [filteredMatches, setFilteredMatches] = useState<MatchWithDetails[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Match['status'] | 'all'>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {
      suggested: 0,
      interested: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    },
    averageScore: 0,
    thisMonth: 0
  })
  
  // ステータス更新モーダル
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [newStatus, setNewStatus] = useState<Match['status']>('suggested')
  const [statusDescription, setStatusDescription] = useState('')
  const [statusNotes, setStatusNotes] = useState('')

  // 新規マッチング作成モーダル
  const [createMatchOpen, setCreateMatchOpen] = useState(false)
  const [newMatch, setNewMatch] = useState({
    candidateId: '',
    jobId: '',
    companyId: '',
    score: 80,
    matchReasons: [] as MatchReason[]
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [matches, searchTerm, statusFilter, companyFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔍 データ読み込み開始...')
      
      // 並行してデータを取得
      const [matchesData, candidatesData, jobsData, companiesData, statsData] = await Promise.all([
        getMatches(),
        getCandidates(),
        getJobs(),
        getCompanies(),
        getMatchStats()
      ])
      
      console.log('📋 取得したデータ:', {
        matches: matchesData.length,
        candidates: candidatesData.length,
        jobs: jobsData.length,
        companies: companiesData.length
      })
      
      setCandidates(candidatesData)
      setJobs(jobsData)
      setCompanies(companiesData)
      setStats(statsData)
      
      // マッチングデータに詳細情報を追加
      const matchesWithDetails = matchesData.map(match => {
        const candidate = candidatesData.find(c => c.id === match.candidateId)
        const job = jobsData.find(j => j.id === match.jobId)
        const company = companiesData.find(c => c.id === match.companyId)
        
        return {
          ...match,
          candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : '候補者不明',
          jobTitle: job?.title || '求人不明',
          companyName: company?.name || '企業不明'
        }
      })
      
      setMatches(matchesWithDetails)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = matches

    // ステータスフィルタ
    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter)
    }

    // 企業フィルタ
    if (companyFilter !== 'all') {
      filtered = filtered.filter(match => match.companyId === companyFilter)
    }

    // 検索フィルタ
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(match =>
        match.candidateName?.toLowerCase().includes(searchLower) ||
        match.jobTitle?.toLowerCase().includes(searchLower) ||
        match.companyName?.toLowerCase().includes(searchLower) ||
        match.matchReasons.some(reason => reason.description?.toLowerCase().includes(searchLower))
      )
    }

    setFilteredMatches(filtered)
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

  const handleStatusUpdate = async () => {
    if (!selectedMatch || !user) return

    try {
      await updateMatchStatus(
        selectedMatch.id,
        newStatus,
        statusDescription,
        user.uid,
        statusNotes || undefined
      )
      
      toast.success('ステータスを更新しました')
      setStatusUpdateOpen(false)
      setSelectedMatch(null)
      setStatusDescription('')
      setStatusNotes('')
      loadData() // データを再読み込み
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('ステータスの更新に失敗しました')
    }
  }

  const handleCreateMatch = async () => {
    if (!user || !newMatch.candidateId || !newMatch.jobId) {
      toast.error('必須項目を入力してください')
      return
    }

    try {
      const job = jobs.find(j => j.id === newMatch.jobId)
      const companyId = job?.companyId || newMatch.companyId

      await createMatch({
        candidateId: newMatch.candidateId,
        jobId: newMatch.jobId,
        companyId,
        score: newMatch.score,
        status: 'suggested',
        matchReasons: newMatch.matchReasons.length > 0 ? newMatch.matchReasons : [{
          type: 'manual',
          description: '手動マッチング',
          weight: 1.0
        }],
        timeline: [{
          id: `timeline_${Date.now()}`,
          status: 'suggested',
          timestamp: new Date(),
          description: '手動でマッチングを作成',
          createdBy: user.uid
        }] as MatchTimeline[],
        createdBy: user.uid
      })

      toast.success('マッチングを作成しました')
      setCreateMatchOpen(false)
      setNewMatch({
        candidateId: '',
        jobId: '',
        companyId: '',
        score: 80,
        matchReasons: []
      })
      loadData() // データを再読み込み
    } catch (error) {
      console.error('Error creating match:', error)
      toast.error('マッチングの作成に失敗しました')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">進捗データを読み込み中...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-800 mb-2">
              進捗管理
            </h1>
            <p className="text-gray-600">求職者と求人のマッチング状況を管理</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
            <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  新規マッチング
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規マッチング作成</DialogTitle>
                  <DialogDescription>
                    候補者と求人をマッチングします
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="candidate">候補者</Label>
                    <Select value={newMatch.candidateId} onValueChange={(value) => 
                      setNewMatch({...newMatch, candidateId: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="候補者を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map(candidate => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.firstName} {candidate.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="job">求人</Label>
                    <Select value={newMatch.jobId} onValueChange={(value) => {
                      const job = jobs.find(j => j.id === value)
                      setNewMatch({
                        ...newMatch, 
                        jobId: value,
                        companyId: job?.companyId || ''
                      })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="求人を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map(job => {
                          const company = companies.find(c => c.id === job.companyId)
                          return (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {company?.name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="score">マッチ度スコア</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newMatch.score}
                      onChange={(e) => setNewMatch({...newMatch, score: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateMatchOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleCreateMatch}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    作成
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                総マッチング数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.total}</div>
              <p className="text-xs text-purple-600 mt-1">
                今月: {stats.thisMonth}件
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                成功率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {stats.total > 0 ? Math.round((stats.byStatus.accepted / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-green-600 mt-1">
                受諾: {stats.byStatus.accepted}件
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                平均スコア
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">{stats.averageScore}%</div>
              <p className="text-xs text-blue-600 mt-1">
                マッチング精度
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                進行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800">
                {stats.byStatus.applied + stats.byStatus.interviewing}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                面接中: {stats.byStatus.interviewing}件
              </p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターと検索 */}
        <Card className="mb-6 border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg text-purple-800">フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="候補者名、求人名、企業名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="border-purple-200 focus:border-purple-400">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="border-purple-200 focus:border-purple-400">
                  <SelectValue placeholder="企業" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての企業</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                {filteredMatches.length} / {matches.length} 件
              </div>
            </div>
          </CardContent>
        </Card>

        {/* マッチングテーブル */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg text-purple-800">マッチング一覧</CardTitle>
            <CardDescription>
              候補者と求人のマッチング状況と進捗
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>候補者</TableHead>
                    <TableHead>求人</TableHead>
                    <TableHead>企業</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id} className="hover:bg-purple-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-medium text-purple-800">
                              {match.candidateName}
                            </div>
                            {match.matchReasons.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {match.matchReasons.slice(0, 2).map((reason, index) => (
                                  <Badge key={index} variant="outline" className="mr-1 text-xs">
                                    {reason.description}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{match.jobTitle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{match.companyName}</div>
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
                            onClick={() => {
                              setSelectedMatch(match)
                              setNewStatus(match.status)
                              setStatusUpdateOpen(true)
                            }}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
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
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <Link href={`/candidates/${match.candidateId}`}>
                              <User className="h-3 w-3" />
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
                  マッチングデータがありません
                </h3>
                <p className="text-gray-600 mb-4">
                  新しいマッチングを作成するか、フィルターを調整してください
                </p>
                <Button
                  onClick={() => setCreateMatchOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  マッチングを作成
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ステータス更新ダイアログ */}
        <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ステータス更新</DialogTitle>
              <DialogDescription>
                マッチングのステータスを更新します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">新しいステータス</Label>
                <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">更新内容 *</Label>
                <Input
                  value={statusDescription}
                  onChange={(e) => setStatusDescription(e.target.value)}
                  placeholder="例: 面接日程調整完了"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="詳細なメモがあれば記入してください"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusUpdateOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!statusDescription.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}