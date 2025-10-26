import { Store } from '@/types/store'
import { createStore, updateStore, findStoreByNameAndCompany } from '@/lib/firestore/stores'

export interface ImportResult {
  success: number
  updated: number
  errors: string[]
}

export const importStoresFromCSV = async (csvText: string): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    updated: 0,
    errors: []
  }

  try {
    // CSV解析
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      result.errors.push('CSVファイルにデータが含まれていません')
      return result
    }

    // 日本語ヘッダーから英語フィールド名へのマッピング
    const headerMapping: Record<string, string> = {
      '店舗名': 'name',
      '企業ID': 'companyId',
      '店舗住所': 'address',
      '店舗URL': 'website',
      '単価': 'unitPrice',
      '席数': 'seatCount',
      '予約制': 'isReservationRequired',
      'InstagramURL': 'instagramUrl',
      '食べログURL': 'tabelogUrl',
      '実績・評価': 'reputation',
      'スタッフレビュー': 'staffReview',
      '握れるまでの期間': 'trainingPeriod',
      '大将の写真URL': 'ownerPhoto',
      '大将の動画URL': 'ownerVideo',
      '店内写真URL': 'interiorPhoto',
      'ステータス': 'status'
    }

    // ヘッダー行を取得（日本語と英語の両方に対応）
    const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const headers = originalHeaders.map(header => headerMapping[header] || header)
    
    // 必須フィールドの確認（英語フィールド名で）
    const requiredFields = ['name', 'companyId']
    const missingFields = requiredFields.filter(field => !headers.includes(field))
    if (missingFields.length > 0) {
      // 日本語フィールド名で逆マッピングしてエラーメッセージを表示
      const jpFieldMapping = Object.fromEntries(Object.entries(headerMapping).map(([jp, en]) => [en, jp]))
      const missingJpFields = missingFields.map(field => jpFieldMapping[field] || field)
      result.errors.push(`必須フィールドが不足しています: ${missingJpFields.join(', ')}`)
      return result
    }

    // データ行を処理
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])
        if (values.length !== headers.length) {
          result.errors.push(`行${i + 1}: フィールド数が一致しません`)
          continue
        }

        // データオブジェクトを作成
        const rowData: Record<string, string> = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        // バリデーション
        if (!rowData.name?.trim()) {
          result.errors.push(`行${i + 1}: 店舗名は必須です`)
          continue
        }

        if (!rowData.companyId?.trim()) {
          result.errors.push(`行${i + 1}: 企業IDは必須です`)
          continue
        }

        // 店舗データを作成
        const storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'> = {
          name: rowData.name.trim(),
          companyId: rowData.companyId?.trim() || '', // 必要に応じて企業IDを指定
          address: rowData.address?.trim() || undefined,
          website: rowData.website?.trim() || undefined,
          unitPrice: rowData.unitPrice ? parseInt(rowData.unitPrice) : undefined,
          seatCount: rowData.seatCount ? parseInt(rowData.seatCount) : undefined,
          isReservationRequired: rowData.isReservationRequired === 'true' ? true : undefined,
          instagramUrl: rowData.instagramUrl?.trim() || undefined,
          tabelogUrl: rowData.tabelogUrl?.trim() || undefined,
          reputation: rowData.reputation?.trim() || undefined,
          staffReview: rowData.staffReview?.trim() || undefined,
          trainingPeriod: rowData.trainingPeriod?.trim() || undefined,
          ownerPhoto: rowData.ownerPhoto?.trim() || undefined,
          ownerVideo: rowData.ownerVideo?.trim() || undefined,
          interiorPhoto: rowData.interiorPhoto?.trim() || undefined,
          status: (rowData.status as 'active' | 'inactive') || 'active'
        }

        // 重複チェック：店舗名と企業IDの組み合わせで既存店舗を検索
        const existingStore = await findStoreByNameAndCompany(
          storeData.name, 
          storeData.companyId
        )

        if (existingStore) {
          // 既存店舗が見つかった場合は更新
          await updateStore(existingStore.id, storeData)
          result.updated++
          console.log(`行${i + 1}: 既存店舗「${storeData.name}」を更新しました`)
        } else {
          // 新規店舗として作成
          await createStore(storeData)
          result.success++
          console.log(`行${i + 1}: 新規店舗「${storeData.name}」を作成しました`)
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        result.errors.push(`行${i + 1}: 処理中にエラーが発生しました - ${error}`)
      }
    }

  } catch (error) {
    console.error('Error importing stores:', error)
    result.errors.push(`CSVファイルの処理中にエラーが発生しました: ${error}`)
  }

  return result
}

// CSV行を適切に解析する関数（カンマを含む値に対応）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++ // 次の引用符をスキップ
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 最後のフィールドを追加
  result.push(current.trim())
  
  return result
}

// CSVテンプレートを生成する関数
export const generateStoresCSVTemplate = (): string => {
  // 日本語ヘッダーと対応する英語フィールド名のマッピング
  const headerMapping = [
    { jp: '店舗名', en: 'name' },                        // 必須
    { jp: '企業ID', en: 'companyId' },                   // 必須
    { jp: '店舗住所', en: 'address' },
    { jp: '店舗URL', en: 'website' },
    { jp: '単価', en: 'unitPrice' },
    { jp: '席数', en: 'seatCount' },
    { jp: '予約制', en: 'isReservationRequired' },      // true/false
    { jp: 'InstagramURL', en: 'instagramUrl' },
    { jp: '食べログURL', en: 'tabelogUrl' },
    { jp: '実績・評価', en: 'reputation' },
    { jp: 'スタッフレビュー', en: 'staffReview' },
    { jp: '握れるまでの期間', en: 'trainingPeriod' },
    { jp: '大将の写真URL', en: 'ownerPhoto' },
    { jp: '大将の動画URL', en: 'ownerVideo' },
    { jp: '店内写真URL', en: 'interiorPhoto' },
    { jp: 'ステータス', en: 'status' }                   // active/inactive
  ]

  // 日本語ヘッダー行を生成
  const jpHeaders = headerMapping.map(item => item.jp)
  
  // サンプルデータ（日本語ヘッダーに対応）
  const sampleData = [
    '鮨さくら',                                          // 店舗名
    'comp_abc123def456',                                // 企業ID（実際の企業IDを入力）
    '東京都中央区銀座3-4-5 銀座ビル1F',                  // 店舗住所
    'https://www.sushi-sakura.co.jp',                   // 店舗URL
    '15000',                                            // 単価（円）
    '12',                                               // 席数
    'true',                                             // 予約制（true/false）
    'https://instagram.com/sushi_sakura_ginza',         // Instagram URL
    'https://tabelog.com/tokyo/A1301/A130101/13001234', // 食べログURL
    '食べログ4.3点・ミシュラン一つ星獲得・江戸前鮨の名店', // 実績・評価
    'ネタの質が非常に高く、大将の技術も一流。コスパも良好で、接客も丁寧で気持ちよく食事できます。', // スタッフレビュー
    '基本技術習得まで約8ヶ月、一人前まで約2年',        // 握れるまでの期間
    'https://example.com/photos/owner-tanaka.jpg',      // 大将の写真URL
    'https://example.com/videos/owner-interview.mp4',   // 大将の動画URL
    'https://example.com/photos/interior-view.jpg',     // 店内写真URL
    'active'                                            // ステータス（active/inactive）
  ]

  // CSV形式で返す（日本語ヘッダー + サンプルデータ）
  return jpHeaders.join(',') + '\n' + sampleData.map(value => 
    value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value
  ).join(',')
}