"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCandidates } from '@/lib/firestore/candidates'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CandidatesDebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectFirestore = async () => {
    setLoading(true)
    try {
      console.log('🔍 直接Firestoreからデータ取得開始...')
      
      // 直接Firestoreから取得
      const snapshot = await getDocs(collection(db, 'candidates'))
      const rawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('📋 生データ:', rawData)
      
      // getCandidates関数経由で取得
      const processedData = await getCandidates()
      
      console.log('🔄 処理済みデータ:', processedData)
      
      setDebugData({
        rawCount: rawData.length,
        processedCount: processedData.length,
        rawData,
        processedData
      })
      
    } catch (error: any) {
      console.error('デバッグエラー:', error)
      setDebugData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 求職者データデバッグ</CardTitle>
          <CardDescription>
            Firestoreのデータと表示の問題を調査
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDirectFirestore} disabled={loading}>
            {loading ? 'デバッグ実行中...' : 'Firestoreデータを直接取得'}
          </Button>
          
          {debugData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold mb-2">🔢 データ件数</h3>
                <p><strong>生データ:</strong> {debugData.rawCount || 0}件</p>
                <p><strong>処理済み:</strong> {debugData.processedCount || 0}件</p>
              </div>
              
              {debugData.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-semibold mb-2">❌ エラー</h3>
                  <p>{debugData.error}</p>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="font-semibold mb-2">📋 生データ (JSON)</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                  {JSON.stringify(debugData.rawData, null, 2)}
                </pre>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold mb-2">🔄 処理済みデータ (JSON)</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                  {JSON.stringify(debugData.processedData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}