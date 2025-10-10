"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Users,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { getJobs, deleteJob } from '@/lib/firestore/jobs'
import { getCompanies } from '@/lib/firestore/companies'
import { getStores } from '@/lib/firestore/stores'
import { Job, jobStatusLabels, employmentTypeLabels } from '@/types/job'
import { Company } from '@/types/company'
import { Store } from '@/types/store'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [jobsData, companiesData, storesData] = await Promise.all([
        getJobs(),
        getCompanies(),
        getStores()
      ])
      setJobs(jobsData)
      setCompanies(companiesData)
      setStores(storesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (confirm('この求人を削除しますか？')) {
      try {
        await deleteJob(id)
        setJobs(jobs.filter(job => job.id !== id))
      } catch (error) {
        console.error('Error deleting job:', error)
        alert('求人の削除に失敗しました')
      }
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '不明な企業'
  }

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId)
    return store?.name || '不明な店舗'
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCompanyName(job.companyId).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesCompany = companyFilter === 'all' || job.companyId === companyFilter

    return matchesSearch && matchesStatus && matchesCompany
  })

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">求人管理</h1>
          <p className="text-gray-600 mt-2">求人情報の管理・編集ができます</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規求人作成
          </Button>
        </Link>
      </div>

      {/* 検索・フィルター */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="求人名・企業名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="active">募集中</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="paused">一時停止</SelectItem>
                <SelectItem value="closed">募集終了</SelectItem>
              </SelectContent>
            </Select>

            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
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

            <div className="text-sm text-gray-500 flex items-center">
              {filteredJobs.length} 件の求人
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 求人一覧 */}
      <div className="grid gap-6">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">求人が見つかりませんでした</p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {jobStatusLabels[job.status]}
                      </Badge>
                      <Badge variant="outline">
                        {employmentTypeLabels[job.employmentType]}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {getCompanyName(job.companyId)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {getStoreName(job.storeId)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        詳細
                      </Button>
                    </Link>
                    <Link href={`/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {job.jobDescription && (
                <CardContent>
                  <CardDescription className="line-clamp-2">
                    {job.jobDescription}
                  </CardDescription>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>基本給: {job.salary.baseSalary ? `${job.salary.baseSalary.toLocaleString()}円` : '要相談'}</span>
                    <span>作成日: {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}