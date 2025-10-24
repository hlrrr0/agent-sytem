import { Store } from '@/types/store'
import { createStore } from '@/lib/firestore/stores'

export interface ImportResult {
  success: number
  errors: string[]
}

export const importStoresFromCSV = async (csvText: string): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    errors: []
  }

  try {
    // CSV解析
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      result.errors.push('CSVファイルにデータが含まれていません')
      return result
    }

    // ヘッダー行を取得
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // 必須フィールドの確認
    const requiredFields = ['name']
    const missingFields = requiredFields.filter(field => !headers.includes(field))
    if (missingFields.length > 0) {
      result.errors.push(`必須フィールドが不足しています: ${missingFields.join(', ')}`)
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

        // Firestoreに保存
        await createStore(storeData)
        result.success++

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
  const headers = [
    'name',                      // 店舗名（必須）
    'companyId',                 // 企業ID（必須）
    'address',                   // 店舗住所
    'website',                   // 店舗URL
    'unitPrice',                 // 単価
    'seatCount',                 // 席数
    'isReservationRequired',     // 予約制（true/false）
    'instagramUrl',              // Instagram URL
    'tabelogUrl',                // 食べログURL
    'reputation',                // 実績・評価
    'staffReview',               // スタッフレビュー
    'trainingPeriod',            // 握れるまでの期間
    'ownerPhoto',                // 大将の写真URL
    'ownerVideo',                // 大将の動画URL
    'interiorPhoto',             // 店内写真URL
    'status'                     // ステータス（active/inactive）
  ]

  const sampleData = [
    'サンプル寿司店',
    'company-123',
    '東京都渋谷区渋谷1-1-1',
    'https://www.sample-sushi.com',
    '5000',
    '12',
    'true',
    'https://instagram.com/sample_sushi',
    'https://tabelog.com/sample',
    '食べログ4.2 ミシュラン一つ星',
    'ネタが新鮮で大将の人柄も良い',
    '6ヶ月',
    'https://example.com/owner.jpg',
    'https://example.com/owner-video.mp4',
    'https://example.com/interior.jpg',
    'active'
  ]

  return headers.join(',') + '\n' + sampleData.join(',')
}