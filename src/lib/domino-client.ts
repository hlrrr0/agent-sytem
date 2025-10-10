import { Company } from '@/types/company'

export interface DominoAPIResponse {
  companies: Company[]
  total: number
  timestamp: string
  filters: {
    status: string
    include_jobs: boolean
    include_leads: boolean
    include_shops: boolean
    since?: string
    limit: number
  }
}

export class DominoAPIClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Dominoシステムから企業データを取得
   */
  async getCompanies(options?: {
    status?: string
    includeJobs?: boolean
    includeLeads?: boolean
    includeShops?: boolean
    since?: string
    limit?: number
  }): Promise<DominoAPIResponse> {
    const params = new URLSearchParams({
      status: options?.status || 'active',
      include_jobs: options?.includeJobs ? 'true' : 'false',
      include_leads: options?.includeLeads ? 'true' : 'false',
      include_shops: options?.includeShops ? 'true' : 'false',
      limit: (options?.limit || 100).toString(),
      ...(options?.since && { since: options.since })
    })

    const response = await fetch(`${this.baseUrl}/api/external/companies?${params}`, {
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
    const response = await fetch(`${this.baseUrl}/api/external/sync?since=${since}&type=${type}`, {
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
      const response = await this.getCompanies({ limit: 1 })
      return {
        success: true,
        message: `接続成功！${response.companies.length}件のデータが取得できました。`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '接続に失敗しました'
      }
    }
  }
}

// デフォルトクライアントインスタンス
export const dominoClient = new DominoAPIClient(
  process.env.NEXT_PUBLIC_DOMINO_API_URL || 'https://domino-system.example.com',
  process.env.NEXT_PUBLIC_DOMINO_API_KEY || ''
)