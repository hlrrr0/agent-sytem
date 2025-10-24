import { Job } from '@/types/job'
import { createJob } from '@/lib/firestore/jobs'

export interface ImportResult {
  success: number
  errors: string[]
}

export const importJobsFromCSV = async (csvText: string): Promise<ImportResult> => {
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
    const requiredFields = ['title', 'companyId', 'status']
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
        if (!rowData.title?.trim()) {
          result.errors.push(`行${i + 1}: 求人タイトルが必要です`)
          continue
        }

        if (!rowData.companyId?.trim()) {
          result.errors.push(`行${i + 1}: 企業IDが必要です`)
          continue
        }

        // Job オブジェクトを作成
        const jobData: Partial<Job> = {
          title: rowData.title.trim(),
          companyId: rowData.companyId.trim(),
          description: rowData.description || '',
          requirements: rowData.requirements || '',
          benefits: rowData.benefits || '',
          location: rowData.location || '',
          workHours: rowData.workHours || '',
          vacation: rowData.vacation || '',
          transportation: rowData.transportation || '',
          dormitoryInfo: rowData.dormitoryInfo || '',
          salaryType: (rowData.salaryType as 'hourly' | 'daily' | 'monthly' | 'annual') || 'monthly',
          salaryMin: rowData.salaryMin ? parseInt(rowData.salaryMin) : undefined,
          salaryMax: rowData.salaryMax ? parseInt(rowData.salaryMax) : undefined,
          employmentType: (rowData.employmentType as 'full-time' | 'part-time' | 'contract' | 'temporary') || 'full-time',
          experience: (rowData.experience as 'none' | 'some' | 'experienced') || 'none',
          education: (rowData.education as 'none' | 'high-school' | 'vocational' | 'university') || 'none',
          status: (rowData.status as 'active' | 'inactive' | 'closed') || 'active',
          isPublic: rowData.isPublic === 'true' || rowData.isPublic === '1',
          tags: rowData.tags ? rowData.tags.split(';').map(tag => tag.trim()).filter(Boolean) : [],
          memo: rowData.memo || ''
        }

        // Firestore に保存
        await createJob(jobData)
        result.success++

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー'
        result.errors.push(`行${i + 1}: ${errorMessage}`)
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    result.errors.push(`CSV解析エラー: ${errorMessage}`)
  }

  return result
}

// CSV行をパースするヘルパー関数
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたクォート
        current += '"'
        i++ // 次の文字をスキップ
      } else {
        // クォートの開始/終了
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
export const generateJobsCSVTemplate = (): string => {
  const headers = [
    'title',           // 求人タイトル（必須）
    'companyId',       // 企業ID（必須）
    'description',     // 求人内容
    'requirements',    // 応募要件
    'benefits',        // 待遇・福利厚生
    'location',        // 勤務地
    'workHours',       // 勤務時間
    'vacation',        // 休日
    'transportation', // 交通手段
    'dormitoryInfo',   // 寮情報
    'salaryType',      // 給与形態 (hourly/daily/monthly/annual)
    'salaryMin',       // 最低給与
    'salaryMax',       // 最高給与
    'employmentType',  // 雇用形態 (full-time/part-time/contract/temporary)
    'experience',      // 経験要件 (none/some/experienced)
    'education',       // 学歴要件 (none/high-school/vocational/university)
    'status',          // ステータス（必須: active/inactive/closed）
    'isPublic',        // 公開状況 (true/false)
    'tags',            // タグ（セミコロン区切り）
    'memo'             // メモ
  ]

  const sampleData = [
    'ウェイター・ウェイトレス',
    'company-123',
    'お客様への接客、注文受け、料理の提供など',
    '未経験歓迎、明るく接客が好きな方',
    '交通費支給、制服貸与、まかない付き',
    '東京都新宿区',
    '10:00-22:00（シフト制）',
    '週2日以上',
    '新宿駅徒歩5分',
    '寮あり',
    'hourly',
    '1000',
    '1200',
    'part-time',
    'none',
    'none',
    'active',
    'true',
    '飲食;接客;未経験歓迎',
    'アルバイト募集中'
  ]

  return headers.join(',') + '\n' + sampleData.join(',')
}