import { Company } from '@/types/company'
import { Store } from '@/types/store'

// Domino APIのレスポンス型
export interface DominoAPIResponse {
  success: boolean
  data: DominoCompany[]
  pagination: {
    limit: number
    offset: number
    count: number
    hasMore: boolean
  }
  filters: {
    status: string | null
    prefecture: string | null
    sizeCategory: string | null
    updatedAfter: string | null
  }
  exportedAt: string
}

// Domino APIから返される企業データの型
export interface DominoCompany {
  id: string
  name: string
  status: 'active' | 'prospect' | 'inactive'
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  sizeCategory: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  totalJobs: number
  totalApproaches: number
  tags: string[]
  createdAt: string
  updatedAt: string
  // 住所関連（可能性のあるフィールド）
  address?: string
  prefecture?: string
  city?: string
  postalCode?: string
  location?: string
  // 連絡先情報
  email?: string
  phone?: string
  website?: string
  url?: string
  // その他の企業情報
  description?: string
  industry?: string
  employeeCount?: number
  capital?: number
  foundedYear?: number
  representative?: string
  // 店舗情報
  stores?: DominoStore[]
  storeCount?: number
  // APIで追加される可能性のあるフィールド
  [key: string]: any
}

// Domino APIから返される店舗データの型
export interface DominoStore {
  id: string
  name: string
  address: string
  prefecture?: string
  city?: string
  phone?: string
  status: 'active' | 'inactive' | 'closed'
  type?: string
  capacity?: number
  openingHours?: string
  createdAt: string
  updatedAt: string
  [key: string]: any
}

/**
 * DominoCompanyをCompanyに変換する
 */
export function convertDominoCompanyToCompany(dominoCompany: DominoCompany): Omit<Company, 'id' | 'createdAt' | 'updatedAt'> {
  console.log('🔄 Domino企業データを変換中:', dominoCompany.name)
  console.log('📋 変換前の全フィールド:', dominoCompany)
  
  // 住所情報の統合（複数のパターンに対応）
  const address = dominoCompany.address || 
                 dominoCompany.location || 
                 (dominoCompany.prefecture && dominoCompany.city ? 
                   `${dominoCompany.prefecture}${dominoCompany.city}` : '') || 
                 ''
  
  // メール情報の取得
  const email = dominoCompany.email || ''
  
  // 電話番号の取得
  const phone = dominoCompany.phone || ''
  
  // ウェブサイトの取得
  const website = dominoCompany.website || dominoCompany.url || ''
  
  // 従業員数の取得
  const employeeCount = dominoCompany.employeeCount || undefined
  
  // 説明文の生成（複数の情報を統合）
  const memoComponents = [
    `Dominoインポート: ${dominoCompany.totalJobs}件の求人、${dominoCompany.totalApproaches}件のアプローチ実績`
  ]
  
  if (dominoCompany.description) {
    memoComponents.push(`概要: ${dominoCompany.description}`)
  }
  
  if (dominoCompany.industry) {
    memoComponents.push(`業界: ${dominoCompany.industry}`)
  }
  
  if (dominoCompany.foundedYear) {
    memoComponents.push(`設立: ${dominoCompany.foundedYear}年`)
  }
  
  if (dominoCompany.capital) {
    memoComponents.push(`資本金: ${dominoCompany.capital.toLocaleString()}円`)
  }
  
  if (dominoCompany.representative) {
    memoComponents.push(`代表者: ${dominoCompany.representative}`)
  }
  
  const convertedCompany = {
    name: dominoCompany.name,
    address: address,
    email: email,
    phone: phone,
    website: website,
    employeeCount: employeeCount,
    capital: dominoCompany.capital,
    establishedYear: dominoCompany.foundedYear,
    representative: dominoCompany.representative,
    size: dominoCompany.size,
    status: (dominoCompany.status === 'inactive' ? 'inactive' : 
            dominoCompany.status === 'prospect' ? 'prospect' : 'active') as Company['status'],
    isPublic: true, // デフォルトで公開
    dominoId: dominoCompany.id,
    importedAt: new Date().toISOString(),
    memo: memoComponents.join('\n'),
    // タグを特徴として設定
    feature1: dominoCompany.tags[0] || undefined,
    feature2: dominoCompany.tags[1] || undefined,
    feature3: dominoCompany.tags[2] || undefined,
  }
  
  console.log('✅ 変換後の企業データ:', convertedCompany)
  
  return convertedCompany
}

/**
 * DominoStoreをStoreに変換する
 */
export function convertDominoStoreToStore(dominoStore: DominoStore, companyId: string): Omit<Store, 'id' | 'createdAt' | 'updatedAt'> {
  console.log('🏪 Domino店舗データを変換中:', dominoStore.name)
  
  return {
    companyId: companyId,
    name: dominoStore.name,
    address: dominoStore.address,
    seatCount: dominoStore.capacity,
    status: dominoStore.status === 'active' ? 'active' : 'inactive'
  }
}

export class DominoAPIClient {
  private baseUrl: string
  private apiKey: string
  private isDevelopment: boolean
  private useProxy: boolean

  constructor(baseUrl: string, apiKey: string, useProxy: boolean = false) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.useProxy = useProxy
    
    // 強制本番モードフラグをチェック
    const forceProductionAPI = process.env.FORCE_PRODUCTION_API === 'true'
    
    // 空文字列が渡された場合は強制的にモックモード
    if (!baseUrl && !apiKey) {
      this.isDevelopment = true
    } else {
      // sushi-domino APIが設定されている場合は実際のAPIを呼び出す
      this.isDevelopment = !forceProductionAPI && 
                          (!baseUrl || 
                           !apiKey || 
                           baseUrl.includes('api.domino.example.com') || 
                           apiKey === 'demo-api-key')
    }
    
    console.log('🔧 DominoAPIClient初期化:', {
      baseUrl: baseUrl || '(空文字)',
      hasApiKey: !!apiKey,
      useProxy: this.useProxy,
      forceProductionAPI,
      isDevelopment: this.isDevelopment,
      reason: this.isDevelopment ? '開発モード（モックデータ）' : '本番モード（実際のAPI）'
    })
  }

  /**
   * 開発環境用のモックレスポンス
   */
  private getMockResponse(): DominoAPIResponse {
    return {
      success: true,
      data: [
        {
          id: 'mock-company-1',
          name: 'サンプル寿司店',
          status: 'active',
          size: 'startup',
          sizeCategory: 'startup',
          totalJobs: 2,
          totalApproaches: 5,
          tags: ['寿司', '和食', '個人店'],
          createdAt: '2025-10-26T14:44:20.691Z',
          updatedAt: '2025-10-26T14:44:20.691Z'
        },
        {
          id: 'mock-company-2',
          name: 'テスト居酒屋',
          status: 'prospect',
          size: 'small',
          sizeCategory: 'small',
          totalJobs: 1,
          totalApproaches: 3,
          tags: ['居酒屋', '和食'],
          createdAt: '2025-10-26T14:44:20.691Z',
          updatedAt: '2025-10-26T14:44:20.691Z'
        }
      ],
      pagination: {
        limit: 10,
        offset: 0,
        count: 2,
        hasMore: false
      },
      filters: {
        status: null,
        prefecture: null,
        sizeCategory: null,
        updatedAfter: null
      },
      exportedAt: '2025-10-26T14:44:20.691Z'
    }
  }

  /**
   * Dominoシステムから企業データを取得
   */
  async getCompanies(options?: {
    status?: string
    sizeCategory?: string
    prefecture?: string
    since?: string
    limit?: number
    offset?: number
  }): Promise<DominoAPIResponse> {
    
    // 開発環境またはAPI設定が不完全な場合はモックデータを返す
    if (this.isDevelopment) {
      console.log('🔧 開発モード: モックデータを返します', options)
      // シミュレーション用の遅延
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResponse = this.getMockResponse()
      mockResponse.filters = {
        status: options?.status || null,
        prefecture: null,
        sizeCategory: options?.sizeCategory || null,
        updatedAfter: options?.since || null
      }
      return mockResponse
    }

    const params = new URLSearchParams({
      ...(options?.status && { status: options.status }),
      ...(options?.sizeCategory && { sizeCategory: options.sizeCategory }),
      ...(options?.since && { updatedAfter: options.since }),
      limit: (options?.limit || 100).toString(),
      offset: (options?.offset || 0).toString()
    })

    // プロキシを使用する場合
    if (this.useProxy) {
      const url = `/api/domino-proxy?${params}`
      console.log('🔄 プロキシ経由でAPI呼び出し:', { url })
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('📡 プロキシ経由 レスポンス:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })
        
        if (!response.ok) {
          let errorData: any = {}
          let errorText = ''
          try {
            const responseText = await response.text()
            errorText = responseText
            if (responseText) {
              try {
                errorData = JSON.parse(responseText)
              } catch (parseError) {
                console.warn('⚠️ レスポンスがJSONではありません:', responseText)
                errorData = { message: responseText }
              }
            }
          } catch (textError) {
            console.error('❌ レスポンステキスト取得エラー:', textError)
          }
          
          console.error('❌ プロキシエラー詳細:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            errorText,
            headers: Object.fromEntries(response.headers.entries())
          })
          
          const errorMessage = errorData.error || errorData.message || errorText || `HTTP ${response.status}`
          throw new Error(`Proxy Error: ${response.status} ${response.statusText} - ${errorMessage}`)
        }
        
        const data = await response.json()
        console.log('📊 プロキシ経由で取得したデータ:', data)
        return data
      } catch (error) {
        console.error('❌ プロキシ Fetch エラー:', error)
        throw error
      }
    }

    // 直接API呼び出し
    const url = `${this.baseUrl}/companies?${params}`
    console.log('🌐 実際のAPI呼び出し:', {
      url,
      method: 'GET',
      hasApiKey: !!this.apiKey,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : '未設定'
    })

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // CORS モードを明示的に指定
        credentials: 'omit', // 認証情報を含めない
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      console.log('📡 API レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Domino API エラー:', errorText)
        throw new Error(`Domino API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📊 APIから取得したデータ:', data)
      return data
    } catch (error) {
      console.error('❌ Fetch エラー詳細:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        url,
        cause: error instanceof Error ? (error as any).cause : undefined
      })
      
      // ネットワークエラーかAPI応答エラーかを判定
      if (error instanceof Error && error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`ネットワークエラー: ${url} への接続に失敗しました。CORSの設定やネットワーク接続を確認してください。`)
      } else {
        throw error
      }
    }
  }

  /**
   * 増分同期用 - 指定日時以降の更新データを取得
   */
  async syncUpdates(since: string, type: 'companies' | 'jobs' = 'companies'): Promise<DominoAPIResponse> {
    // 開発環境またはAPI設定が不完全な場合はモックデータを返す
    if (this.isDevelopment) {
      console.log('🔧 開発モード: 増分同期のモックデータを返します', { since, type })
      await new Promise(resolve => setTimeout(resolve, 800))
      return this.getMockResponse()
    }

    const response = await fetch(`${this.baseUrl}/companies?since=${since}&type=${type}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Domino Sync API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      isDevelopment: this.isDevelopment,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : '未設定'
    }
  }

  /**
   * 接続テスト
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔌 Domino接続テストを開始...')
      
      if (this.isDevelopment) {
        console.log('🔧 開発モード: モック接続テストを実行')
        await new Promise(resolve => setTimeout(resolve, 1500)) // リアルな遅延をシミュレート
        return {
          success: true,
          message: '開発モード: モック接続が成功しました。Domino API設定を確認してください。'
        }
      }

      const response = await this.getCompanies({ limit: 1 })
      return {
        success: true,
        message: `接続成功！${response.data.length}件のデータが取得できました。`
      }
    } catch (error) {
      console.error('❌ Domino接続テストエラー:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '接続に失敗しました'
      }
    }
  }
}

// デフォルトクライアントインスタンス
export const dominoClient = new DominoAPIClient(
  process.env.DOMINO_API_URL || '/api/hr-export',
  process.env.DOMINO_API_KEY || ''
)