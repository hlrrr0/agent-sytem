"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  TrendingUp, 
  Plus, 
  Search, 
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Edit,
  Eye
} from 'lucide-react'
import { Match } from '@/types/matching'
import { Candidate } from '@/types/candidate'
import { Job } from '@/types/job'
import { Company } from '@/types/company'
import { getMatches, createMatch, updateMatchStatus } from '@/lib/firestore/matches'
import { getCandidates } from '@/lib/firestore/candidates'
import { getJobs } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'

interface MatchWithDetails extends Match {
  candidateName?: string
  jobTitle?: string
  companyName?: string
}

function ProgressPageContent() {
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

  // Dialog states
  const [createMatchOpen, setCreateMatchOpen] = useState(false)
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null)
  const [newStatus, setNewStatus] = useState<Match['status']>('suggested')
  const [newMatchData, setNewMatchData] = useState({
    candidateId: '',
    jobId: '',
    score: 50,
    notes: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    filterMatches()
  }, [matches, searchTerm, statusFilter, companyFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [matchesData, candidatesData, jobsData, companiesData] = await Promise.all([
        getMatches(),
        getCandidates(),
        getJobs(),
        getCompanies()
      ])

      setCandidates(candidatesData)
      setJobs(jobsData)
      setCompanies(companiesData)

      // Add names to matches
      const matchesWithDetails = matchesData.map(match => {
        const candidate = candidatesData.find(c => c.id === match.candidateId)
        const job = jobsData.find(j => j.id === match.jobId)
        const company = companiesData.find(c => c.id === job?.companyId)

        return {
          ...match,
          candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : '不明',
          jobTitle: job?.title || '不明',
          companyName: company?.name || '不明'
        }
      })

      setMatches(matchesWithDetails)
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = () => {
    let filtered = matches

    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter)
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(match => match.companyName === companyFilter)
    }

    setFilteredMatches(filtered)
  }

  const handleCreateMatch = async () => {
    try {
      if (!newMatchData.candidateId || !newMatchData.jobId) {
        alert('求職者と求人を選択してください')
        return
      }

      const selectedJob = jobs.find(j => j.id === newMatchData.jobId)
      if (!selectedJob) {
        alert('選択された求人が見つかりません')
        return
      }

      const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'> = {
        candidateId: newMatchData.candidateId,
        jobId: newMatchData.jobId,
        companyId: selectedJob.companyId,
        status: 'suggested',
        score: newMatchData.score,
        matchReasons: [{
          type: 'manual',
          description: '手動でマッチングを作成',
          weight: 1.0
        }],
        timeline: [{
          id: `timeline_${Date.now()}`,
          status: 'suggested',
          timestamp: new Date(),
          description: 'マッチングが作成されました',
          createdBy: user?.uid || '',
          notes: newMatchData.notes
        }],
        createdBy: user?.uid || '',
        notes: newMatchData.notes
      }

      await createMatch(matchData)
      await loadData() // Reload data
      
      setCreateMatchOpen(false)
      setNewMatchData({ candidateId: '', jobId: '', score: 50, notes: '' })
    } catch (error) {
      console.error('マッチング作成エラー:', error)
      alert('マッチングの作成に失敗しました')
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedMatch) return

    try {
      await updateMatchStatus(
        selectedMatch.id,
        newStatus,
        `ステータスを${getStatusLabel(newStatus)}に更新`,
        user?.uid || '',
        ''
      )
      
      await loadData() // Reload data
      
      setStatusUpdateOpen(false)
      setSelectedMatch(null)
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  const getStatusIcon = (status: Match['status']) => {
    switch (status) {
      case 'suggested': return <Clock className="h-4 w-4" />
      case 'interested': return <Send className="h-4 w-4" />
      case 'applied': return <Send className="h-4 w-4" />
      case 'interviewing': return <CheckCircle className="h-4 w-4" />
      case 'offered': return <CheckCircle className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <AlertCircle className="h-4 w-4" />
      case 'withdrawn': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'suggested': return 'bg-gray-100 text-gray-800'
      case 'interested': return 'bg-blue-100 text-blue-800'
      case 'applied': return 'bg-orange-100 text-orange-800'
      case 'interviewing': return 'bg-purple-100 text-purple-800'
      case 'offered': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Match['status']) => {
    switch (status) {
      case 'suggested': return '提案済み'
      case 'interested': return '興味あり'
      case 'applied': return '応募済み'
      case 'interviewing': return '面接中'
      case 'offered': return '内定'
      case 'accepted': return '承諾'
      case 'rejected': return '不採用'
      case 'withdrawn': return '辞退'
      default: return status
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-gray-600">進捗データを読み込み中...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="container mx-auto py-8 px-4">
          {/* ヘッダー */}
          <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">進捗管理</h1>
                  <p className="text-orange-100">求職者と求人のマッチング状況を管理</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => loadData()}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新
                </Button>
                <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Plus className="h-4 w-4 mr-2" />
                      新規マッチング
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>新規マッチング作成</DialogTitle>
                      <DialogDescription>
                        求職者と求人をマッチングします
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="candidate">求職者</Label>
                        <Select value={newMatchData.candidateId} onValueChange={(value) => 
                          setNewMatchData(prev => ({ ...prev, candidateId: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="求職者を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {candidates.map((candidate) => (
                              <SelectItem key={candidate.id} value={candidate.id}>
                                {candidate.firstName} {candidate.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="job">求人</Label>
                        <Select value={newMatchData.jobId} onValueChange={(value) => 
                          setNewMatchData(prev => ({ ...prev, jobId: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="求人を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job) => {
                              const company = companies.find(c => c.id === job.companyId)
                              return (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.title} - {company?.name || '不明'}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="score">マッチングスコア ({newMatchData.score})</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={newMatchData.score}
                          onChange={(e) => setNewMatchData(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">備考</Label>
                        <Textarea
                          id="notes"
                          value={newMatchData.notes}
                          onChange={(e) => setNewMatchData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="マッチングに関する備考..."
                          className="min-h-[80px]"
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
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        作成
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* フィルター */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-orange-800">検索とフィルター</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="求職者名、職種、企業名で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="ステータス" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="suggested">提案済み</SelectItem>
                      <SelectItem value="interested">興味あり</SelectItem>
                      <SelectItem value="applied">応募済み</SelectItem>
                      <SelectItem value="interviewing">面接中</SelectItem>
                      <SelectItem value="offered">内定</SelectItem>
                      <SelectItem value="accepted">承諾</SelectItem>
                      <SelectItem value="rejected">不採用</SelectItem>
                      <SelectItem value="withdrawn">辞退</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="企業" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.name}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* マッチングテーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-800">マッチング進捗一覧</CardTitle>
              <CardDescription>
                {filteredMatches.length} 件のマッチング
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>求職者</TableHead>
                      <TableHead>職種</TableHead>
                      <TableHead>企業</TableHead>
                      <TableHead>スコア</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>更新日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          マッチングデータがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMatches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell className="font-medium">
                            {match.candidateName}
                          </TableCell>
                          <TableCell>{match.jobTitle}</TableCell>
                          <TableCell>{match.companyName}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">
                                {match.score}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(match.score, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(match.status)} border-0`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(match.status)}
                                {getStatusLabel(match.status)}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {match.updatedAt && typeof match.updatedAt === 'object' && match.updatedAt instanceof Date
                              ? match.updatedAt.toLocaleDateString()
                              : match.updatedAt && typeof match.updatedAt === 'string'
                              ? new Date(match.updatedAt).toLocaleDateString()
                              : '不明'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <Link href={`/progress/${match.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setNewStatus(match.status)
                                  setStatusUpdateOpen(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ステータス更新ダイアログ */}
          <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ステータス更新</DialogTitle>
                <DialogDescription>
                  {selectedMatch?.candidateName} - {selectedMatch?.jobTitle} のステータスを変更
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newStatus">新しいステータス</Label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suggested">提案済み</SelectItem>
                      <SelectItem value="interested">興味あり</SelectItem>
                      <SelectItem value="applied">応募済み</SelectItem>
                      <SelectItem value="interviewing">面接中</SelectItem>
                      <SelectItem value="offered">内定</SelectItem>
                      <SelectItem value="accepted">承諾</SelectItem>
                      <SelectItem value="rejected">不採用</SelectItem>
                      <SelectItem value="withdrawn">辞退</SelectItem>
                    </SelectContent>
                  </Select>
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
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  更新
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function ProgressPage() {
  return <ProgressPageContent />
}