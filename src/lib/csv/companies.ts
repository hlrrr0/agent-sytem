import { Company } from '@/types/company'
import { createCompany } from '@/lib/firestore/companies'

export interface ImportResult {
  success: number
  errors: string[]
}

export const importCompaniesFromCSV = async (csvText: string): Promise<ImportResult> => {
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
    const requiredFields = ['name', 'status']
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
          result.errors.push(`行${i + 1}: 企業名は必須です`)
          continue
        }

        if (!['active', 'inactive'].includes(rowData.status)) {
          result.errors.push(`行${i + 1}: ステータスは 'active' または 'inactive' である必要があります`)
          continue
        }

        // 企業データを作成
        const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
          name: rowData.name.trim(),
          memo: rowData.memo?.trim() || '',
          status: rowData.status as 'active' | 'inactive'
        }

        // Firestoreに保存
        await createCompany(companyData)
        result.success++

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        result.errors.push(`行${i + 1}: 処理中にエラーが発生しました - ${error}`)
      }
    }

  } catch (error) {
    console.error('Error importing companies:', error)
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