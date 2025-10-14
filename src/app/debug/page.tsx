"use client"

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const [uid, setUid] = useState('6xmYk6L56iYXfRKJBBBNgUBfV7Y2')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ページロード時に自動的にチェック
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    if (!uid.trim()) {
      setError('UIDを入力してください')
      return
    }

    setLoading(true)
    setError('')
    setUserInfo(null)

    try {
      console.log('🔍 ユーザー情報を取得中:', uid)
      const userDocRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('📋 取得したユーザー情報:', userData)
        
        const isApproved = userData.role === 'user' || userData.role === 'admin'
        const isActive = userData.status === 'active'
        const canAccess = isApproved && isActive

        console.log('🔍 計算結果:', { isApproved, isActive, canAccess })

        setUserInfo({
          ...userData,
          computed: {
            isApproved,
            isActive,
            canAccess
          }
        })
      } else {
        setError('ユーザーが見つかりません')
      }
    } catch (err: any) {
      console.error('❌ エラー:', err)
      setError(`エラー: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔍 ユーザーデバッグツール</CardTitle>
          <CardDescription>
            Firestoreのユーザー情報とアクセス制御状況を確認
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="ユーザーUID"
              className="flex-1"
            />
            <Button onClick={checkUser} disabled={loading}>
              {loading ? '確認中...' : '確認'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {userInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold mb-2">基本情報</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {userInfo.id}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                  <p><strong>表示名:</strong> {userInfo.displayName}</p>
                  <p><strong>Role:</strong> <span className={`px-2 py-1 rounded text-xs ${
                    userInfo.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    userInfo.role === 'user' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{userInfo.role}</span></p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${
                    userInfo.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{userInfo.status}</span></p>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold mb-2">アクセス制御状況</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>isApproved:</strong> <span className={userInfo.computed.isApproved ? 'text-green-600' : 'text-red-600'}>
                    {userInfo.computed.isApproved ? '✅ 承認済み' : '❌ 未承認'}
                  </span></p>
                  <p><strong>isActive:</strong> <span className={userInfo.computed.isActive ? 'text-green-600' : 'text-red-600'}>
                    {userInfo.computed.isActive ? '✅ アクティブ' : '❌ 非アクティブ'}
                  </span></p>
                  <p><strong>canAccess:</strong> <span className={userInfo.computed.canAccess ? 'text-green-600' : 'text-red-600'}>
                    {userInfo.computed.canAccess ? '✅ アクセス可能' : '❌ アクセス不可'}
                  </span></p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="font-semibold mb-2">生データ (JSON)</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}