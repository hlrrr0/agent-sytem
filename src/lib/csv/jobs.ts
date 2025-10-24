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

        if (!['draft', 'published', 'active', 'paused', 'closed'].includes(rowData.status)) {
          result.errors.push(`行${i + 1}: ステータスが無効です (draft/published/active/paused/closed)`)
          continue
        }

        // Job オブジェクトを作成
        const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
          title: rowData.title.trim(),
          companyId: rowData.companyId.trim(),
          status: (rowData.status as 'draft' | 'published' | 'active' | 'paused' | 'closed') || 'draft',
          // オプションフィールド
          storeId: rowData.storeId?.trim(),
          businessType: rowData.businessType?.trim(),
          employmentType: rowData.employmentType?.trim(),
          trialPeriod: rowData.trialPeriod?.trim(),
          workingHours: rowData.workingHours?.trim(),
          holidays: rowData.holidays?.trim(),
          overtime: rowData.overtime?.trim(),
          salaryInexperienced: rowData.salaryInexperienced?.trim(),
          salaryExperienced: rowData.salaryExperienced?.trim(),
          requiredSkills: rowData.requiredSkills?.trim(),
          jobDescription: rowData.jobDescription?.trim(),
          smokingPolicy: rowData.smokingPolicy?.trim(),
          insurance: rowData.insurance?.trim(),
          benefits: rowData.benefits?.trim(),
          selectionProcess: rowData.selectionProcess?.trim(),
          consultantReview: rowData.consultantReview?.trim(),
          createdBy: rowData.createdBy?.trim()
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
    'title',                   // 求人タイトル（必須）
    'companyId',               // 企業ID（必須）
    'status',                  // ステータス（必須: draft/published/active/paused/closed）
    'storeId',                 // 店舗ID
    'businessType',            // 業態
    'employmentType',          // 雇用形態
    'trialPeriod',             // 試用期間
    'workingHours',            // 勤務時間
    'holidays',                // 休日・休暇
    'overtime',                // 時間外労働
    'salaryInexperienced',     // 給与（未経験）
    'salaryExperienced',       // 給与（経験者）
    'requiredSkills',          // 求めるスキル
    'jobDescription',          // 職務内容
    'smokingPolicy',           // 受動喫煙防止措置
    'insurance',               // 加入保険
    'benefits',                // 待遇・福利厚生
    'selectionProcess',        // 選考プロセス
    'consultantReview',        // キャリア担当からの感想
    'createdBy'                // 作成者ID
  ]

  const sampleData = [
    'ウェイター・ウェイトレス',
    'company-123',
    'active',
    'store-456',
    'レストラン',
    'アルバイト・パート',
    '3ヶ月',
    '10:00-22:00（シフト制）',
    '週2日以上',
    '月20時間まで',
    '時給1000円～',
    '時給1200円～',
    '接客経験者歓迎',
    'お客様への接客、注文受け、料理の提供など',
    '全面禁煙',
    '雇用保険・労災保険',
    '交通費支給、制服貸与、まかない付き',
    '面接',
    'アットホームな職場です',
    'user-789'
  ]

  return headers.join(',') + '\n' + sampleData.join(',')
}