"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Briefcase,
  Store
} from 'lucide-react'
import { Company } from '@/types/company'
import { getCompanyById } from '@/lib/firestore/companies'
import { toast } from 'sonner'

const statusLabels = {
  active: { label: 'アクティブ', color: 'bg-green-500' },
  inactive: { label: '非アクティブ', color: 'bg-gray-500' },
  prospect: { label: '見込み客', color: 'bg-blue-500' },
  prospect_contacted: { label: '見込み客/接触あり', color: 'bg-cyan-500' },
  appointment: { label: 'アポ', color: 'bg-yellow-500' },
  no_approach: { label: 'アプローチ不可', color: 'bg-red-500' },
}

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) return

      try {
        setLoading(true)
        const companyData = await getCompanyById(companyId)
        
        if (!companyData) {
          toast.error('企業が見つかりませんでした')
          router.push('/companies')
          return
        }

        setCompany(companyData)
      } catch (error) {
        console.error('Error loading company:', error)
        toast.error('企業データの読み込みに失敗しました')
        router.push('/companies')
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [companyId, router])

  const getStatusBadge = (status: Company['status']) => {
    const statusInfo = statusLabels[status]
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">企業データを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">企業が見つかりません</h1>
          <Link href="/companies">
            <Button>企業一覧に戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

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
              <Building2 className="h-8 w-8" />
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(company.status)}
              {company.dominoId && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Domino連携
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${company.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              編集
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">企業名</p>
                    <p className="text-gray-600">{company.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">規模</p>
                    <p className="text-gray-600">{company.size}</p>
                  </div>
                </div>

                {company.industry && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">業界</p>
                      <p className="text-gray-600">{company.industry}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">登録日</p>
                    <p className="text-gray-600">
                      {company.createdAt 
                        ? new Date(company.createdAt).toLocaleDateString('ja-JP')
                        : '不明'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {company.businessType && company.businessType.length > 0 && (
                <div>
                  <p className="font-medium mb-2">業態</p>
                  <div className="flex flex-wrap gap-2">
                    {company.businessType.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 連絡先情報 */}
          <Card>
            <CardHeader>
              <CardTitle>連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">住所</p>
                  <p className="text-gray-600">{company.address || '未登録'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">電話番号</p>
                  {company.phone ? (
                    <a 
                      href={`tel:${company.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {company.phone}
                    </a>
                  ) : (
                    <p className="text-gray-600">未登録</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">メールアドレス</p>
                  {company.email ? (
                    <a 
                      href={`mailto:${company.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {company.email}
                    </a>
                  ) : (
                    <p className="text-gray-600">未登録</p>
                  )}
                </div>
              </div>

              {company.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">ウェブサイト</p>
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {company.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 企業説明 */}
          {company.description && (
            <Card>
              <CardHeader>
                <CardTitle>企業説明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/companies/${company.id}/edit`}>
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  企業情報を編集
                </Button>
              </Link>
              <Link href={`/companies/${company.id}/jobs`}>
                <Button className="w-full justify-start" variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  求人情報を管理
                </Button>
              </Link>
              <Link href={`/companies/${company.id}/leads`}>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  リード情報を管理
                </Button>
              </Link>
              {company.shops && company.shops.length > 0 && (
                <Link href={`/companies/${company.id}/shops`}>
                  <Button className="w-full justify-start" variant="outline">
                    <Store className="h-4 w-4 mr-2" />
                    店舗情報を確認
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">関連データ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">求人数</span>
                <Badge variant="outline">
                  {company.jobs?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">リード数</span>
                <Badge variant="outline">
                  {company.leads?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">店舗数</span>
                <Badge variant="outline">
                  {company.shops?.length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Domino連携情報 */}
          {company.dominoId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domino連携情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Domino ID</p>
                  <p className="font-mono text-sm">{company.dominoId}</p>
                </div>
                {company.importedAt && (
                  <div>
                    <p className="text-sm text-gray-600">最終インポート</p>
                    <p className="text-sm">
                      {new Date(company.importedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* 店舗セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>店舗一覧</span>
                <Link href={`/stores/new?companyId=${company.id}`}>
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    店舗追加
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-600">関連店舗の管理</p>
                <Link href={`/stores?companyId=${company.id}`}>
                  <Button variant="outline" className="w-full">
                    この企業の店舗を表示
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}