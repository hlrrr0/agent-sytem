"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  Database
} from 'lucide-react'
import { toast } from 'sonner'
import { dominoClient, convertDominoCompanyToCompany, convertDominoStoreToStore, DominoAPIClient } from '@/lib/domino-client'
import { createCompany, updateCompany, findCompanyByDominoId } from '@/lib/firestore/companies'
import { createStore } from '@/lib/firestore/stores'
import { Company } from '@/types/company'

export default function DominoImportPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <DominoImportPageContent />
    </ProtectedRoute>
  )
}

function DominoImportPageContent() {
  const [importing, setImporting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [lastImportResult, setLastImportResult] = useState<{
    success: number
    updated: number
    errors: string[]
    timestamp: string
    storesCreated?: number
  } | null>(null)
  
  // インポートログの型定義と状態
  interface ImportLog {
    id: string
    timestamp: string
    status: 'success' | 'partial' | 'error'
    settings: {
      status: string
      sizeCategory: string
      prefecture: string
      limit: number
      since: string
      sinceUntil: string
      includeEmpty: boolean
    }
    result: {
      success: number
      updated: number
      errors: string[]
      totalRequested: number
      actualReceived: number
      storesCreated: number
    }
    duration: number // 実行時間（秒）
  }
  
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])
  
  const [settings, setSettings] = useState({
    status: 'active', // アクティブ企業のみに固定
    sizeCategory: 'all',
    prefecture: '',
    limit: 100,
    since: '',
    sinceUntil: '', // 追加：終了日時
    includeEmpty: false, // 追加：更新日時が空白の企業も含むかどうか
    useActualAPI: false, // デフォルトはfalse、ユーザーが明示的に切り替える
    useProxy: true // デフォルトでプロキシを使用（CORS回避）
  })

  // 設定に基づいてDominoクライアントを取得
  const getDominoClient = () => {
    console.log('🔧 getDominoClient: useActualAPI =', settings.useActualAPI)
    
    if (settings.useActualAPI) {
      // 実際のAPIを強制使用
      const apiUrl = process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
      const apiKey = process.env.NEXT_PUBLIC_DOMINO_API_KEY || 'your-hr-api-secret-key'
      console.log('🌐 実際のAPIクライアントを作成:', { apiUrl, hasApiKey: !!apiKey, useProxy: settings.useProxy })
      return new DominoAPIClient(apiUrl, apiKey, settings.useProxy)
    } else {
      // モックデータを使用
      console.log('🔧 モックデータクライアントを作成')
      return new DominoAPIClient('', '', false) // 空文字でモックモードを強制
    }
  }

  // コンポーネントマウント時のデバッグ情報
  useEffect(() => {
    console.log('🚀 DominoImportPageContent がマウントされました')
    console.log('🔧 環境変数確認:', {
      NODE_ENV: process.env.NODE_ENV,
      DOMINO_API_URL: process.env.DOMINO_API_URL,
      HAS_API_KEY: !!process.env.DOMINO_API_KEY,
      NEXT_PUBLIC_DOMINO_API_URL: process.env.NEXT_PUBLIC_DOMINO_API_URL,
      HAS_NEXT_PUBLIC_API_KEY: !!process.env.NEXT_PUBLIC_DOMINO_API_KEY,
      FORCE_PRODUCTION_API: process.env.FORCE_PRODUCTION_API,
      ACTUAL_API_URL: process.env.DOMINO_API_URL,
      ACTUAL_API_KEY: process.env.DOMINO_API_KEY ? '***設定済み***' : '未設定'
    })
    
    // DominoClientの状態も確認
    console.log('🔧 DominoClient設定確認:', dominoClient.getDebugInfo())
    
    // 初期設定値も確認
    console.log('🔧 初期設定値:', settings)
    
    // インポートログをローカルストレージから読み込み
    try {
      const savedLogs = localStorage.getItem('domino-import-logs')
      if (savedLogs) {
        const logs = JSON.parse(savedLogs) as ImportLog[]
        setImportLogs(logs.slice(-10)) // 最新10件のみ保持
        console.log('📚 保存されたインポートログを読み込み:', logs.length + '件')
      }
    } catch (error) {
      console.error('❌ インポートログの読み込みエラー:', error)
    }
  }, [])

  // インポートログを保存する関数
  const saveImportLog = (log: ImportLog) => {
    try {
      const updatedLogs = [log, ...importLogs].slice(0, 10) // 最新10件のみ保持
      setImportLogs(updatedLogs)
      localStorage.setItem('domino-import-logs', JSON.stringify(updatedLogs))
      console.log('💾 インポートログを保存:', log.id)
    } catch (error) {
      console.error('❌ インポートログの保存エラー:', error)
    }
  }

  // ログをクリアする関数
  const clearImportLogs = () => {
    setImportLogs([])
    localStorage.removeItem('domino-import-logs')
    console.log('🗑️ インポートログをクリア')
  }

  // 設定変更を監視
  useEffect(() => {
    console.log('⚙️ 設定が更新されました:', settings)
  }, [settings])

  // 基本APIテスト（最小パラメータ）
  const testBasicAPI = async () => {
    console.log('🧪 基本APIテストを開始（最小パラメータ）')
    
    try {
      const response = await fetch('/api/domino-proxy?limit=3')
      const result = await response.json()
      
      console.log('🧪 基本APIテスト結果:', {
        status: response.status,
        ok: response.ok,
        result
      })
      
      if (response.ok) {
        toast.success(`✅ 基本API成功！${result.data?.length || 0}件取得`)
      } else {
        toast.error(`❌ 基本API失敗: ${result.error || result.message}`)
      }
      
    } catch (error) {
      console.error('❌ 基本APIテストエラー:', error)
      toast.error(`基本APIテストエラー: ${error}`)
    }
  }

  // 環境変数確認
  const checkEnvironmentVariables = async () => {
    console.log('🔍 環境変数確認を開始')
    
    try {
      const response = await fetch('/api/env-check')
      const envData = await response.json()
      
      console.log('🔍 環境変数確認結果:', envData)
      
      // クライアントサイド環境変数も確認
      console.log('🔍 クライアントサイド環境変数:', {
        NEXT_PUBLIC_DOMINO_API_URL: process.env.NEXT_PUBLIC_DOMINO_API_URL,
        NEXT_PUBLIC_DOMINO_API_KEY: process.env.NEXT_PUBLIC_DOMINO_API_KEY ? process.env.NEXT_PUBLIC_DOMINO_API_KEY.substring(0, 8) + '...' : '未設定'
      })
      
      // 整合性をチェック
      const serverKey = envData.server.DOMINO_API_KEY
      const clientKey = process.env.NEXT_PUBLIC_DOMINO_API_KEY?.substring(0, 8) + '...'
      
      if (serverKey === clientKey) {
        toast.success('✅ サーバー・クライアント環境変数が一致')
      } else {
        toast.error('❌ サーバー・クライアント環境変数が不一致')
        console.error('環境変数不一致:', { serverKey, clientKey })
      }
      
    } catch (error) {
      console.error('❌ 環境変数確認エラー:', error)
      toast.error(`環境変数確認エラー: ${error}`)
    }
  }

  // 詳細認証テスト
  const testDetailedAuth = async () => {
    console.log('🔍 詳細認証テストを開始')
    
    try {
      const response = await fetch('/api/domino-auth-test')
      const result = await response.json()
      
      console.log('🔍 詳細認証テスト結果:', result)
      
      if (result.success) {
        toast.success(`✅ 認証成功！使用方式: ${result.workingMethod}`)
        console.log('✅ 動作する認証方式:', result.workingMethod)
        console.log('📊 取得データサンプル:', result.data)
      } else {
        toast.error('❌ すべての認証方式が失敗')
        console.log('❌ 認証テスト詳細:', result.allTests)
        
        // 各テスト結果を詳細表示
        result.allTests?.forEach((test: any, index: number) => {
          console.log(`テスト${index + 1} (${test.method}):`, test)
        })
      }
      
    } catch (error) {
      console.error('❌ 詳細認証テストエラー:', error)
      toast.error(`認証テストエラー: ${error}`)
    }
  }

  // 直接接続テスト
  const testDirectConnection = async () => {
    console.log('🔌 直接接続テストを開始')
    
    try {
      const response = await fetch('/api/domino-test')
      const result = await response.json()
      
      console.log('🔌 直接接続テスト結果:', result)
      
      if (result.success) {
        toast.success(`✅ 直接接続成功！ステータス: ${result.status}`)
        console.log('📊 接続テストデータ:', result.responseData)
      } else {
        toast.error(`❌ 直接接続失敗: ${result.error}`)
        console.error('❌ 接続失敗詳細:', result)
      }
      
    } catch (error) {
      console.error('❌ 直接接続テストエラー:', error)
      toast.error(`直接接続テストエラー: ${error}`)
    }
  }

  // 別エンドポイントでの店舗データ確認
  const testAlternativeStoreEndpoints = async () => {
    console.log('🔍 別エンドポイントでの店舗データ確認を開始')
    
    const baseUrl = process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
    const apiKey = process.env.NEXT_PUBLIC_DOMINO_API_KEY || 'your-hr-api-secret-key'
    
    const endpointsToTest = [
      '/stores',
      '/shops', 
      '/locations',
      '/branches',
      '/company-stores',
      '/companies/stores'
    ]
    
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🔍 テスト中: ${endpoint}`)
        
        const testUrl = `${baseUrl}${endpoint}?limit=1&api_key=${apiKey}`
        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        })
        
        console.log(`📊 ${endpoint} レスポンス:`, {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type')
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${endpoint} データ:`, data)
          toast.success(`${endpoint} エンドポイントが利用可能です！`)
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint} エラー:`, error)
      }
    }
    
    toast.info('別エンドポイントテスト完了 - コンソールを確認してください')
  }

  // 店舗データフィールド確認テスト
  const testStoreDataFields = async () => {
    console.log('🏪 店舗データフィールド確認テストを開始')
    
    try {
      const response = await fetch('/api/domino-test')
      const result = await response.json()
      
      console.log('🏪 店舗データフィールドテスト結果:', result)
      
      if (result.success && result.responseData) {
        const companies = result.responseData.data || []
        let hasAnyStores = false
        let storeFieldVariations = new Set<string>()
        
        companies.forEach((company: any) => {
          // 店舗関連フィールドを検索
          Object.keys(company).forEach(key => {
            if (key.toLowerCase().includes('store') || 
                key.toLowerCase().includes('shop') || 
                key.toLowerCase().includes('branch') ||
                key.toLowerCase().includes('location')) {
              storeFieldVariations.add(key)
            }
          })
          
          if (company.stores && Array.isArray(company.stores) && company.stores.length > 0) {
            hasAnyStores = true
          }
        })
        
        if (hasAnyStores) {
          toast.success(`✅ 店舗データが見つかりました！`)
          console.log('🏪 発見された店舗関連フィールド:', Array.from(storeFieldVariations))
        } else {
          toast.error(`❌ 店舗データが見つかりませんでした`)
          console.log('⚠️ 発見された店舗関連フィールド:', Array.from(storeFieldVariations))
          console.log('💡 Domino APIが店舗データを含んでいない可能性があります')
        }
      } else {
        toast.error(`❌ API呼び出し失敗: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ 店舗データフィールドテストエラー:', error)
      toast.error(`店舗データフィールドテストエラー: ${error}`)
    }
  }

  // API認証テスト
  const testApiAuth = async () => {
    console.log('🔐 API認証テストを開始')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
      const apiKey = process.env.NEXT_PUBLIC_DOMINO_API_KEY || 'your-hr-api-secret-key'
      
      console.log('🔐 認証情報確認:', {
        apiUrl,
        apiKeyLength: apiKey?.length,
        apiKeyPrefix: apiKey?.substring(0, 12) + '...',
        apiKeyFull: apiKey === 'your-hr-api-secret-key' ? '⚠️ デフォルト値のまま' : '✅ カスタム値設定済み',
        isDefaultKey: apiKey === 'your-hr-api-secret-key'
      })
      
      // プロキシ経由で認証テスト
      const testUrl = '/api/domino-proxy?limit=1'
      console.log('🔐 認証テスト URL:', testUrl)
      
      const response = await fetch(testUrl)
      
      console.log('🔐 レスポンス基本情報:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('❌ JSONパースエラー:', parseError)
        const textData = await response.text()
        console.log('📄 レスポンステキスト:', textData)
        data = { rawResponse: textData }
      }
      
      console.log('🔐 認証テスト結果詳細:', {
        status: response.status,
        ok: response.ok,
        data: data,
        dataType: typeof data,
        hasSuccess: data?.success,
        hasError: data?.error,
        hasData: data?.data
      })
      
      if (response.ok && data?.success) {
        const dataCount = data?.data?.length || 0
        toast.success(`✅ API認証成功！${dataCount}件のデータを取得しました`)
        console.log('✅ 認証成功 - 取得データサンプル:', data.data?.[0])
      } else {
        const errorMsg = data?.error || data?.message || '不明なエラー'
        toast.error(`❌ API認証失敗: ${errorMsg}`)
        console.error('❌ 認証失敗の詳細:', data)
      }
      
    } catch (error) {
      console.error('❌ 認証テストエラー (catch):', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(`認証テストエラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 基本的なネットワークテスト
  const testBasicNetwork = async () => {
    console.log('🌐 基本ネットワークテストを開始')
    
    try {
      // 1. 基本的なHTTPSアクセステスト
      const testUrl = 'https://httpbin.org/get'
      console.log('🔗 テストURL:', testUrl)
      const response = await fetch(testUrl)
      console.log('✅ 基本ネットワーク:', response.ok ? '正常' : 'エラー')
      
      // 2. sushi-domino サーバーの基本接続テスト
      const baseUrl = process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
      console.log('🔗 sushi-domino基本接続テスト:', baseUrl)
      
      const dominoResponse = await fetch(baseUrl, { method: 'HEAD' })
      console.log('📡 sushi-domino接続:', {
        status: dominoResponse.status,
        ok: dominoResponse.ok,
        headers: Object.fromEntries(dominoResponse.headers.entries())
      })
      
    } catch (error) {
      console.error('❌ ネットワークテストエラー:', error)
    }
  }

  const testConnection = async () => {
    console.log('🔌 接続テストボタンがクリックされました')
    setTestingConnection(true)
    try {
      console.log('🔌 dominoClient.testConnection() を呼び出し中...')
      const client = getDominoClient()
      const result = await client.testConnection()
      console.log('✅ 接続テスト結果:', result)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('❌ 接続テストエラー:', error)
      toast.error(`接続テストに失敗しました: ${error}`)
    } finally {
      setTestingConnection(false)
      console.log('🔌 接続テスト完了')
    }
  }

  // 店舗データ処理のヘルパー関数
  const processStores = async (dominoCompany: any, companyId: string, errors: string[]) => {
    let storesCreated = 0
    
    console.log(`🔍 企業「${dominoCompany.name}」の店舗データチェック:`, {
      hasStores: !!(dominoCompany.stores),
      storesLength: dominoCompany.stores?.length || 0,
      storesArray: dominoCompany.stores,
      companyId: companyId
    })
    
    if (dominoCompany.stores && dominoCompany.stores.length > 0) {
      console.log(`🏪 企業「${dominoCompany.name}」の店舗データ（${dominoCompany.stores.length}件）を処理中...`)
      
      for (const dominoStore of dominoCompany.stores) {
        try {
          console.log(`🏪 店舗処理中: "${dominoStore.name}" (ステータス: ${dominoStore.status})`)
          
          if (dominoStore.status === 'active') {
            console.log(`✅ アクティブ店舗「${dominoStore.name}」を作成します`)
            const storeData = convertDominoStoreToStore(dominoStore, companyId)
            console.log(`📋 変換後の店舗データ:`, storeData)
            
            const storeId = await createStore(storeData)
            storesCreated++
            console.log(`✅ 店舗「${dominoStore.name}」を作成しました (ID: ${storeId})`)
          } else {
            console.log(`⏭️ 店舗「${dominoStore.name}」はステータス「${dominoStore.status}」のためスキップします`)
          }
        } catch (storeError) {
          console.error(`❌ 店舗「${dominoStore.name}」の作成エラー:`, storeError)
          errors.push(`店舗「${dominoStore.name}」の作成に失敗: ${storeError}`)
        }
      }
    } else {
      console.log(`ℹ️ 企業「${dominoCompany.name}」には店舗データがありません`)
      console.log(`📋 企業データの全フィールド:`, Object.keys(dominoCompany))
    }
    
    console.log(`📊 企業「${dominoCompany.name}」の店舗処理結果: ${storesCreated}件作成`)
    return storesCreated
  }

  const handleImport = async () => {
    const startTime = Date.now()
    const logId = `import-${Date.now()}`
    
    console.log('📥 Dominoインポートを開始します')
    console.log('🔧 詳細設定:', {
      ...settings,
      useActualAPI_boolean: !!settings.useActualAPI,
      useActualAPI_type: typeof settings.useActualAPI
    })
    
    setImporting(true)
    
    let importResult = {
      success: 0,
      updated: 0,
      errors: [] as string[],
      totalRequested: settings.limit,
      actualReceived: 0,
      activeReceived: 0, // アクティブ企業の受信数
      storesCreated: 0 // 店舗作成数を追加
    }
    
    try {
      // Dominoから企業データを取得
      console.log('📡 Dominoクライアントからデータを取得中...')
      const client = getDominoClient()
      
      // Firestoreインデックスエラー回避のため、最小限のパラメータで開始
      const requestParams: any = {
        limit: settings.limit,
        status: 'active' // 必ずアクティブ企業のみを要求
      }
      
      // パラメータを段階的に追加（デフォルト値は送信しない）
      if (settings.sizeCategory && settings.sizeCategory !== 'all' && settings.sizeCategory !== '') {
        requestParams.sizeCategory = settings.sizeCategory
      }
      
      if (settings.since) {
        requestParams.since = settings.since
      }
      
      if (settings.sinceUntil) {
        requestParams.until = settings.sinceUntil
      }
      
      // 更新日時が空白の企業も含むかどうか
      if (settings.includeEmpty) {
        requestParams.includeEmpty = true
      }
      
      console.log('📤 送信パラメータ:', requestParams)
      
      const dominoResponse = await client.getCompanies(requestParams)

      console.log('📊 Dominoから取得したデータ:', dominoResponse)
      console.log('📊 データ構造詳細:', {
        type: typeof dominoResponse.data,
        isArray: Array.isArray(dominoResponse.data),
        keys: dominoResponse.data ? Object.keys(dominoResponse.data as any) : 'null/undefined',
        structure: dominoResponse.data
      })
      
      // 生のレスポンスデータを詳細にログ出力
      console.log('🔍 生のレスポンスデータ (JSON文字列):', JSON.stringify(dominoResponse, null, 2))
      
      // レスポンス構造に応じてデータを取得
      let companies: any[] = []
      const responseData = dominoResponse.data as any
      
      if (Array.isArray(responseData)) {
        // 新しい /integrated 形式: [{ company: {...}, shops: [...] }]
        if (responseData.length > 0 && responseData[0].company) {
          console.log('🔄 /integrated 形式のデータを変換中...')
          companies = responseData.map((item: any) => {
            const company = { ...item.company }
            // shops を stores として追加
            if (item.shops && Array.isArray(item.shops)) {
              company.stores = item.shops
            }
            return company
          })
          console.log('✅ /integrated 形式のデータ変換完了')
        } else {
          // 従来の形式: 直接企業配列
          companies = responseData
        }
      } else if (responseData && responseData.companies && Array.isArray(responseData.companies)) {
        companies = responseData.companies
      } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        companies = responseData.data
      } else {
        console.error('❌ 予期しないデータ構造:', dominoResponse.data)
        throw new Error('取得したデータが予期した形式ではありません')
      }
      
      console.log('📊 抽出した企業データ:', {
        type: typeof companies,
        isArray: Array.isArray(companies),
        length: companies?.length || 0,
        firstItem: companies?.[0] || 'なし',
        hasStoresInFirstItem: !!(companies?.[0]?.stores),
        firstItemStoreCount: companies?.[0]?.stores?.length || 0
      })
      
      // アクティブ企業の数を事前にカウント
      const activeCompanies = companies.filter((company: any) => company.status === 'active')
      const totalReceived = companies.length
      const activeCount = activeCompanies.length
      
      console.log('📊 データ統計:', {
        totalReceived,
        activeCount,
        nonActiveCount: totalReceived - activeCount,
        requestedLimit: settings.limit,
        achievement: `${activeCount}/${settings.limit} (${Math.round(activeCount / settings.limit * 100)}%)`
      })
      
      console.log('📋 各企業の詳細データ:')
      companies.forEach((company: any, index: number) => {
        console.log(`🏢 企業${index + 1}:`, {
          id: company.id,
          name: company.name,
          status: company.status,
          size: company.size,
          isActive: company.status === 'active',
          willBeProcessed: company.status === 'active' && !company.id.startsWith('mock-'),
          hasStores: !!(company.stores && company.stores.length > 0),
          storeCount: company.stores?.length || 0,
          activeStoreCount: company.stores?.filter((s: any) => s.status === 'active').length || 0
        })
        
        // 店舗データの詳細も表示
        if (company.stores && company.stores.length > 0) {
          console.log(`🏪 企業「${company.name}」の店舗一覧:`)
          company.stores.forEach((store: any, storeIndex: number) => {
            console.log(`  店舗${storeIndex + 1}: ${store.name} (ステータス: ${store.status})`)
            console.log(`    店舗詳細:`, store)
          })
        } else {
          console.log(`ℹ️ 企業「${company.name}」には店舗データがありません`)
          console.log(`🔍 企業データのキー一覧:`, Object.keys(company))
          console.log(`🔍 stores フィールドの値:`, company.stores)
          console.log(`🔍 shop フィールドの値:`, company.shop)
          console.log(`🔍 shopList フィールドの値:`, company.shopList)
          console.log(`🔍 storeList フィールドの値:`, company.storeList)
        }
      })

      let successCount = 0
      let updatedCount = 0
      const errors: string[] = []

      // 取得したデータをFirestoreに保存
      for (const dominoCompany of companies) {
        try {
          console.log(`🏢 企業「${dominoCompany.name}」（ステータス: ${dominoCompany.status}）を処理中...`)
          
          // アクティブ企業のみインポート
          if (dominoCompany.status !== 'active') {
            console.log(`⏭️ 企業「${dominoCompany.name}」はステータス「${dominoCompany.status}」のためスキップします`)
            continue
          }
          
          // モックデータの場合の特別処理
          if (dominoCompany.id.startsWith('mock-')) {
            console.log(`🧪 モックデータ「${dominoCompany.name}」を処理します（テスト用）`)
            
            // モックデータでも店舗データの処理をテスト
            const mockStoresCreated = await processStores(dominoCompany, 'mock-company-id', errors)
            importResult.storesCreated += mockStoresCreated
            
            console.log(`⚠️ モックデータ「${dominoCompany.name}」のFirestore保存はスキップしますが、店舗処理は実行しました`)
            continue // Firestoreの企業保存は行わない
          }
          
          // DominoCompanyをCompanyに変換
          const companyData = convertDominoCompanyToCompany(dominoCompany)

          // Domino IDで既存企業をチェック
          console.log(`🔍 Domino ID「${dominoCompany.id}」で既存企業をチェック中...`)
          const existingCompany = await findCompanyByDominoId(dominoCompany.id)
          
          if (existingCompany) {
            // 見つかった企業IDが実際に存在するか再確認
            console.log(`🔄 既存企業「${dominoCompany.name}」(Firestore ID: ${existingCompany.id})を確認中...`)
            
            try {
              // 実際に企業が存在するかチェック
              const { getCompanyById } = await import('@/lib/firestore/companies')
              const verifyCompany = await getCompanyById(existingCompany.id)
              
              if (verifyCompany) {
                console.log(`📝 更新データ:`, companyData)
                await updateCompany(existingCompany.id, companyData)
                updatedCount++
                console.log(`✅ 企業「${dominoCompany.name}」を更新しました`)
                
                // 企業更新時にも店舗データを処理
                const storesCreated = await processStores(dominoCompany, existingCompany.id, errors)
                importResult.storesCreated += storesCreated
              } else {
                // IDは検索で見つかったが実際には存在しない場合は新規作成
                console.log(`⚠️ 企業ID「${existingCompany.id}」は存在しないため、新規作成します`)
                console.log(`📝 作成データ:`, companyData)
                const newCompanyId = await createCompany(companyData)
                successCount++
                console.log(`✅ 企業「${dominoCompany.name}」を新規作成しました (Firestore ID: ${newCompanyId})`)
                
                // 存在チェック失敗からの新規作成時の店舗データ処理
                const storesCreated = await processStores(dominoCompany, newCompanyId, errors)
                importResult.storesCreated += storesCreated
              }
            } catch (updateError) {
              console.error(`❌ 企業「${dominoCompany.name}」の更新に失敗。新規作成を試行します:`, updateError)
              // 更新に失敗した場合は新規作成
              console.log(`📝 作成データ:`, companyData)
              const newCompanyId = await createCompany(companyData)
              successCount++
              console.log(`✅ 企業「${dominoCompany.name}」を新規作成しました (Firestore ID: ${newCompanyId})`)
              
              // 更新失敗からの新規作成時の店舗データ処理
              const storesCreated = await processStores(dominoCompany, newCompanyId, errors)
              importResult.storesCreated += storesCreated
            }
          } else {
            // 新規企業として作成
            console.log(`🆕 新規企業「${dominoCompany.name}」を作成します`)
            console.log(`📝 作成データ:`, companyData)
            const newCompanyId = await createCompany(companyData)
            successCount++
            console.log(`✅ 企業「${dominoCompany.name}」を新規作成しました (Firestore ID: ${newCompanyId})`)
            
            // 新規作成時の店舗データ処理
            const storesCreated = await processStores(dominoCompany, newCompanyId, errors)
            importResult.storesCreated += storesCreated
          }
        } catch (error) {
          console.error(`Error processing company ${dominoCompany.name}:`, error)
          errors.push(`企業「${dominoCompany.name}」の処理に失敗: ${error}`)
        }
      }

      // 実際に受信したデータ数を記録
      importResult.actualReceived = companies.length
      importResult.activeReceived = companies.filter((c: any) => c.status === 'active').length
      importResult.success = successCount
      importResult.updated = updatedCount
      importResult.errors = errors

      const result = {
        success: successCount,
        updated: updatedCount,
        errors,
        timestamp: new Date().toISOString(),
        storesCreated: importResult.storesCreated
      }
      setLastImportResult(result)

      // ログを保存
      const duration = Math.round((Date.now() - startTime) / 1000)
      const importLog: ImportLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        status: errors.length > 0 ? (successCount + updatedCount > 0 ? 'partial' : 'error') : 'success',
        settings: {
          status: 'active', // 常にアクティブ固定
          sizeCategory: settings.sizeCategory,
          prefecture: settings.prefecture,
          limit: settings.limit,
          since: settings.since,
          sinceUntil: settings.sinceUntil,
          includeEmpty: settings.includeEmpty
        },
        result: importResult,
        duration
      }
      saveImportLog(importLog)

      const activeReceived = importResult.activeReceived
      const totalProcessed = successCount + updatedCount
      
      if (errors.length > 0) {
        toast.error(`インポート完了: アクティブ企業${activeReceived}件受信、処理${totalProcessed}件（新規${successCount}件、更新${updatedCount}件）、エラー${errors.length}件`)
      } else {
        toast.success(`Dominoからアクティブ企業${activeReceived}件を受信し、${totalProcessed}件を処理しました（新規${successCount}件、更新${updatedCount}件）`)
      }
      
    } catch (error) {
      console.error('Error importing from Domino:', error)
      toast.error(`Dominoからのインポートに失敗しました: ${error}`)
      
      // エラー時もログを保存
      const duration = Math.round((Date.now() - startTime) / 1000)
      const errorLog: ImportLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        status: 'error',
        settings: {
          status: 'active', // 常にアクティブ固定
          sizeCategory: settings.sizeCategory,
          prefecture: settings.prefecture,
          limit: settings.limit,
          since: settings.since,
          sinceUntil: settings.sinceUntil,
          includeEmpty: settings.includeEmpty
        },
        result: {
          ...importResult,
          errors: [String(error)]
        },
        duration
      }
      saveImportLog(errorLog)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Dominoからのインポート（管理者限定）</h1>
            <p className="text-muted-foreground">Dominoシステムから企業データを詳細設定で取得します</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 接続テスト */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Domino接続テスト
            </CardTitle>
            <CardDescription>
              まず、Dominoシステムとの接続を確認してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dominoシステムとの接続状況を確認します。開発環境ではモックテストが実行されます。
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={testBasicAPI}
                  variant="outline"
                  className="min-w-[140px] hover:bg-green-50 hover:border-green-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  🧪 基本APIテスト
                </Button>
                
                <Button 
                  onClick={testStoreDataFields}
                  variant="outline"
                  className="min-w-[140px] hover:bg-purple-50 hover:border-purple-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  🏪 店舗データ確認
                </Button>
                
                <Button 
                  onClick={testAlternativeStoreEndpoints}
                  variant="outline"
                  className="min-w-[140px] hover:bg-indigo-50 hover:border-indigo-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  🔍 別エンドポイント
                </Button>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={checkEnvironmentVariables}
                  variant="outline"
                  className="min-w-[140px] hover:bg-orange-50 hover:border-orange-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  環境変数確認
                </Button>
                
                <Button 
                  onClick={testDirectConnection}
                  variant="outline"
                  className="min-w-[140px] hover:bg-blue-50 hover:border-blue-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  🔌 直接接続テスト
                </Button>
                
                <Button 
                  onClick={testStoreDataFields}
                  variant="outline"
                  className="min-w-[140px] hover:bg-purple-50 hover:border-purple-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  🏪 店舗データ確認
                </Button>
                
                <Button 
                  onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'}/companies?limit=1`
                    console.log('🔗 ブラウザで直接アクセス:', url)
                    window.open(url, '_blank')
                  }}
                  variant="outline"
                  className="min-w-[140px] hover:bg-green-50 hover:border-green-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  APIを直接確認
                </Button>
              </div>
              
              {settings.useActualAPI && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm">
                    <strong>接続先:</strong> {process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'}/companies
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    💡 「APIを直接確認」ボタンでブラウザから直接アクセスして、データが取得できるか確認できます
                  </div>
                  <div className="text-xs text-orange-600 mt-2">
                    ⚠️ 認証エラーが発生する場合は、正しいAPIキーが設定されているか確認してください
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* インポート設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              インポート設定
            </CardTitle>
            <CardDescription>
              Dominoシステムからアクティブ企業のデータ取得条件を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">企業ステータス</Label>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">アクティブ企業のみ</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Dominoシステムからアクティブステータスの企業のみが取得されます<br/>
                    ⚠️ セキュリティ上の理由により、非アクティブ企業は対象外です
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">アクティブ企業の取得件数</Label>
                  <Select 
                    value={settings.limit.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, limit: parseInt(value) }))}
                  >
                    <SelectTrigger id="limit">
                      <SelectValue placeholder="取得件数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">アクティブ企業50件</SelectItem>
                      <SelectItem value="100">アクティブ企業100件</SelectItem>
                      <SelectItem value="150">アクティブ企業150件</SelectItem>
                      <SelectItem value="500">アクティブ企業500件</SelectItem>
                      <SelectItem value="1000">アクティブ企業1000件</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    💡 指定した件数のアクティブ企業データのみが取得されます
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sizeCategory">企業規模でフィルタ</Label>
                <Select value={settings.sizeCategory || 'all'} onValueChange={(value) => setSettings(prev => ({ ...prev, sizeCategory: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="企業規模を選択（全て）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ての企業規模</SelectItem>
                    <SelectItem value="startup">スタートアップ</SelectItem>
                    <SelectItem value="small">小企業</SelectItem>
                    <SelectItem value="medium">中企業</SelectItem>
                    <SelectItem value="large">大企業</SelectItem>
                    <SelectItem value="enterprise">エンタープライズ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県でフィルタ</Label>
                <Input
                  id="prefecture"
                  placeholder="例: 東京都"
                  value={settings.prefecture}
                  onChange={(e) => setSettings(prev => ({ ...prev, prefecture: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="since">更新日時（開始）</Label>
                  <Input
                    id="since"
                    type="datetime-local"
                    value={settings.since}
                    onChange={(e) => setSettings(prev => ({ ...prev, since: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    この日時以降に更新された企業を取得
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sinceUntil">更新日時（終了）</Label>
                  <Input
                    id="sinceUntil"
                    type="datetime-local"
                    value={settings.sinceUntil}
                    onChange={(e) => setSettings(prev => ({ ...prev, sinceUntil: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    この日時以前に更新された企業を取得（省略可）
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeEmpty"
                    checked={settings.includeEmpty}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeEmpty: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeEmpty">更新日時が空白の企業も含める</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 更新日時がnull/未設定の企業データも取得対象に含めます<br/>
                  ⚠️ 日時範囲を指定した場合でも、更新日時が空白の企業はこのオプションにより取得されます<br/>
                  🔍 <strong>使用例：</strong> 新規登録された企業（まだ更新されていない）や、更新日時が記録されていない古いデータを含めたい場合
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">開発者設定</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="useActualAPI">実際のAPIを使用</Label>
                      <p className="text-sm text-muted-foreground">
                        オフ：モックデータを使用（開発用）/ オン：実際のsushi-domino APIを呼び出し
                      </p>
                      <p className="text-xs text-blue-600 font-mono">
                        現在の値: {settings.useActualAPI ? 'true (API使用)' : 'false (モック使用)'}
                      </p>
                    </div>
                    <Switch
                      id="useActualAPI"
                      checked={settings.useActualAPI}
                      onCheckedChange={(checked) => {
                        console.log('🔄 useActualAPI設定変更:', checked)
                        setSettings(prev => {
                          const newSettings = { ...prev, useActualAPI: checked }
                          console.log('🔧 新しい設定:', newSettings)
                          return newSettings
                        })
                      }}
                    />
                  </div>
                  {settings.useActualAPI && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        🌐 実際のAPI使用中: https://sushi-domino.vercel.app/api/hr-export/companies
                      </div>
                    </div>
                  )}
                  {!settings.useActualAPI && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        🔧 モックデータ使用中: テスト用のサンプルデータが表示されます
                      </div>
                    </div>
                  )}
                  
                  {settings.useActualAPI && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="useProxy">プロキシ経由でアクセス</Label>
                        <p className="text-sm text-muted-foreground">
                          CORS問題を回避するため、サーバー側プロキシ経由でAPIにアクセス
                        </p>
                        <p className="text-xs text-green-600 font-mono">
                          推奨: {settings.useProxy ? 'ON (プロキシ使用)' : 'OFF (直接アクセス)'}
                        </p>
                      </div>
                      <Switch
                        id="useProxy"
                        checked={settings.useProxy}
                        onCheckedChange={(checked) => {
                          console.log('🔄 useProxy設定変更:', checked)
                          setSettings(prev => ({ ...prev, useProxy: checked }))
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">インポート設定</h4>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Dominoシステムから取得したデータは、以下の項目が自動的にマッピングされます：
                  </div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>企業名、企業規模、ステータス</li>
                    <li>求人数、アプローチ数（統計情報）</li>
                    <li>タグ情報（企業特徴として設定）</li>
                    <li>作成日時、更新日時</li>
                  </ul>
                  <div className="text-sm text-yellow-600">
                    ⚠️ 住所・メールアドレスなどの詳細情報は、インポート後に手動で入力してください。
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* インポート実行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              データ取得実行
            </CardTitle>
            <CardDescription>
              上記設定でDominoシステムからデータを取得します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> この操作は既存のデータを上書きする可能性があります。
                  実行前に設定内容をご確認ください。
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="min-w-[140px]"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      取得中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Dominoから取得
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* インポート結果 */}
        {lastImportResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastImportResult.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                最新のインポート結果
              </CardTitle>
              <CardDescription>
                {new Date(lastImportResult.timestamp).toLocaleString('ja-JP')} に実行
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{lastImportResult.success}</div>
                  <div className="text-sm text-green-700">企業新規</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{lastImportResult.updated}</div>
                  <div className="text-sm text-blue-700">企業更新</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{lastImportResult.storesCreated || 0}</div>
                  <div className="text-sm text-purple-700">店舗作成</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{lastImportResult.errors.length}</div>
                  <div className="text-sm text-red-700">エラー</div>
                </div>
              </div>
              
              {lastImportResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">エラー詳細:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {lastImportResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* インポートログ */}
        {importLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  インポート履歴
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImportLogs}
                  className="text-red-600 hover:text-red-700"
                >
                  ログをクリア
                </Button>
              </CardTitle>
              <CardDescription>
                直近{importLogs.length}件のインポート実行ログ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          log.status === 'success' ? 'bg-green-500' :
                          log.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">
                          {new Date(log.timestamp).toLocaleString('ja-JP')}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({log.duration}秒)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {log.result.actualReceived}/{log.settings.limit}件取得
                        {log.result.storesCreated > 0 && ` (店舗${log.result.storesCreated}件)`}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-semibold text-green-600">{log.result.success}</div>
                        <div className="text-xs text-green-700">企業新規</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-semibold text-blue-600">{log.result.updated}</div>
                        <div className="text-xs text-blue-700">企業更新</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-lg font-semibold text-purple-600">{log.result.storesCreated || 0}</div>
                        <div className="text-xs text-purple-700">店舗作成</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-lg font-semibold text-red-600">{log.result.errors.length}</div>
                        <div className="text-xs text-red-700">エラー</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>設定:</strong> {log.settings.status}, {log.settings.sizeCategory || '全て'}, 
                        {log.settings.prefecture || '全地域'}
                      </div>
                      {log.settings.since && (
                        <div>
                          <strong>期間:</strong> {new Date(log.settings.since).toLocaleDateString('ja-JP')}
                          {log.settings.sinceUntil && ` 〜 ${new Date(log.settings.sinceUntil).toLocaleDateString('ja-JP')}`}
                        </div>
                      )}
                      {log.result.errors.length > 0 && (
                        <div className="mt-2">
                          <strong>エラー:</strong>
                          <div className="max-h-20 overflow-y-auto bg-red-50 p-2 rounded mt-1">
                            {log.result.errors.slice(0, 3).map((error, idx) => (
                              <div key={idx} className="text-xs text-red-700">{error}</div>
                            ))}
                            {log.result.errors.length > 3 && (
                              <div className="text-xs text-red-600">...他{log.result.errors.length - 3}件</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}