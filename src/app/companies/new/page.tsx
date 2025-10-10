"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCompany } from '@/lib/firestore/companies'
import { Company } from '@/types/company'

export default function NewCompanyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    emailAddress: '',
    address: '',
    employeeCount: '',
    capital: '',
    establishedYear: '',
    representative: '',
    website: '',
    logo: '',
    feature1: '',
    feature2: '',
    feature3: '',
    contractStartDate: '',
    status: 'active' as Company['status'],
    isPublic: true,
    consultantId: ''
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        address: formData.address,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        capital: formData.capital ? parseInt(formData.capital) : undefined,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        representative: formData.representative || undefined,
        website: formData.website || undefined,
        logo: formData.logo || undefined,
        feature1: formData.feature1 || undefined,
        feature2: formData.feature2 || undefined,
        feature3: formData.feature3 || undefined,
        contractStartDate: formData.contractStartDate || undefined,
        status: formData.status,
        isPublic: formData.isPublic,
        consultantId: formData.consultantId || undefined
      }

      await createCompany(companyData)
      router.push('/companies')
    } catch (error) {
      console.error('Error creating company:', error)
      alert('企業の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>新規企業登録</CardTitle>
          <CardDescription>新しい企業情報を登録します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">企業名 *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">担当者名 *</Label>
                  <Input
                    id="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">電話番号 *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailAddress">メールアドレス *</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">住所 *</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/companies')}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '登録中...' : '企業を登録'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
