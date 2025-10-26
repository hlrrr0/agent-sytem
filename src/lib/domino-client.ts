import { Company } from '@/types/company'

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
}

/**
 * DominoCompanyをCompanyに変換する
 */
export function convertDominoCompanyToCompany(dominoCompany: DominoCompany): Company {
  return {
    id: dominoCompany.id,
    name: dominoCompany.name,
    address: '', // DominoAPIには住所がないため空文字
    email: '', // DominoAPIにはメールがないため空文字
    size: dominoCompany.size,
    status: dominoCompany.status === 'inactive' ? 'inactive' : 
           dominoCompany.status === 'prospect' ? 'prospect' : 'active',
    isPublic: true, // デフォルトで公開
    createdAt: dominoCompany.createdAt,
    updatedAt: dominoCompany.updatedAt,
    dominoId: dominoCompany.id,
    importedAt: new Date().toISOString(),
    memo: `Dominoインポート: ${dominoCompany.totalJobs}件の求人、${dominoCompany.totalApproaches}件のアプローチ実績`,
    // タグを特徴として設定
    feature1: dominoCompany.tags[0] || undefined,
    feature2: dominoCompany.tags[1] || undefined,
    feature3: dominoCompany.tags[2] || undefined,
  }
}

export class DominoAPIClient {
  private baseUrl: string
  private apiKey: string
  private isDevelopment: boolean

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.isDevelopment = process.env.NODE_ENV === 'development' || !baseUrl || !apiKey
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

    const response = await fetch(`${this.baseUrl}/companies?${params}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Domino API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
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