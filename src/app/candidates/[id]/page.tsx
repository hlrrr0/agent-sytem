"use client"

import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Candidate } from '@/types/candidate'

interface CandidateDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidateId, setCandidateId] = useState<string>('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)

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
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            求職者詳細
          </h1>
          <p className="text-gray-600 mt-2">
            {candidate.firstName} {candidate.lastName}の詳細情報
          </p>
        </div>
        <Link href={`/candidates/${candidateId}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            編集
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
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
        
        <Card>
          <CardHeader>
            <CardTitle>スキル・資格</CardTitle>
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
      </div>
    </ProtectedRoute>
  )
}