"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Building2, 
  Store, 
  Briefcase,
  Download,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { importCompaniesFromCSV, generateCompaniesCSVTemplate } from '@/lib/csv/companies'
import { importStoresFromCSV, generateStoresCSVTemplate } from '@/lib/csv/stores'
import { importJobsFromCSV, generateJobsCSVTemplate } from '@/lib/csv/jobs'

export default function ImportPage() {
  const [uploading, setUploading] = useState({
    companies: false,
    stores: false,
    jobs: false
  })

  const handleFileUpload = async (
    file: File, 
    type: 'companies' | 'stores' | 'jobs'
  ) => {
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('CSVファイルを選択してください')
      return
    }

    setUploading(prev => ({ ...prev, [type]: true }))

    try {
      const text = await file.text()
      let result

      switch (type) {
        case 'companies':
          result = await importCompaniesFromCSV(text)
          break
        case 'stores':
          result = await importStoresFromCSV(text)
          break
        case 'jobs':
          result = await importJobsFromCSV(text)
          break
      }

      toast.success(`${getTypeName(type)}を${result.success}件インポートしました${result.errors.length > 0 ? `（エラー: ${result.errors.length}件）` : ''}`)
      
      if (result.errors.length > 0) {
        console.error(`${type} import errors:`, result.errors)
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      toast.error(`${getTypeName(type)}のインポートに失敗しました`)
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'companies': return '企業'
      case 'stores': return '店舗'
      case 'jobs': return '求人'
      default: return ''
    }
  }

  const downloadTemplate = (type: 'companies' | 'stores' | 'jobs') => {
    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'companies':
        csvContent = generateCompaniesCSVTemplate()
        filename = 'companies_template.csv'
        break
      case 'stores':
        csvContent = generateStoresCSVTemplate()
        filename = 'stores_template.csv'
        break
      case 'jobs':
        csvContent = generateJobsCSVTemplate()
        filename = 'jobs_template.csv'
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              管理画面に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">CSVインポート</h1>
            <p className="text-gray-600 mt-2">
              企業・店舗・求人データをCSVファイルから一括インポートできます
            </p>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            インポート前の注意事項
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700">
          <ul className="list-disc list-inside space-y-2">
            <li>CSVファイルはUTF-8エンコーディングで保存してください</li>
            <li>ヘッダー行（1行目）は必須です</li>
            <li>既存データと重複する場合は上書きされます</li>
            <li>エラーがある行はスキップされ、その他の行は正常にインポートされます</li>
            <li>大量データの場合は処理に時間がかかる場合があります</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 企業インポート */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              企業データ
            </CardTitle>
            <CardDescription>
              企業情報をCSVファイルからインポート
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companies-file">CSVファイル選択</Label>
              <Input
                id="companies-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'companies')
                }}
                disabled={uploading.companies}
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('companies')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
              
              <div className="text-xs text-gray-500">
                必須フィールド: name, address, email, size, isPublic, status<br />
                オプション: phone, website, industry, memo など
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 店舗インポート */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              店舗データ
            </CardTitle>
            <CardDescription>
              店舗情報をCSVファイルからインポート
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stores-file">CSVファイル選択</Label>
              <Input
                id="stores-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'stores')
                }}
                disabled={uploading.stores}
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('stores')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
              
              <div className="text-xs text-gray-500">
                必須フィールド: name, companyId<br />
                オプション: address, website, unitPrice など
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 求人インポート */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              求人データ
            </CardTitle>
            <CardDescription>
              求人情報をCSVファイルからインポート
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobs-file">CSVファイル選択</Label>
              <Input
                id="jobs-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'jobs')
                }}
                disabled={uploading.jobs}
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('jobs')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
              
              <div className="text-xs text-gray-500">
                必須フィールド: title, companyId, status<br />
                オプション: storeId, businessType, employmentType など
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* インポート状況 */}
      {(uploading.companies || uploading.stores || uploading.jobs) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              インポート中...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploading.companies && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>企業データをインポート中...</span>
                </div>
              )}
              {uploading.stores && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>店舗データをインポート中...</span>
                </div>
              )}
              {uploading.jobs && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>求人データをインポート中...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}