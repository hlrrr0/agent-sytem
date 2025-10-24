"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { createCompany } from '@/lib/firestore/companies'
import { Company } from '@/types/company'
import CompanyForm from '@/components/companies/CompanyForm'
import { toast } from 'sonner'

export default function NewCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: Partial<Company>) => {
    setLoading(true)
    
    try {
      const companyId = await createCompany(formData as Omit<Company, 'id' | 'createdAt' | 'updatedAt'>)
      toast.success('企業が正常に作成されました')
      router.push(`/companies/${companyId}`)
    } catch (error) {
      console.error('Error creating company:', error)
      toast.error('企業の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
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
                新規企業登録
              </h1>
              <p className="text-gray-600 mt-2">
                新しい企業情報を登録します
              </p>
            </div>
          </div>
        </div>

        <CompanyForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </ProtectedRoute>
  )
}
