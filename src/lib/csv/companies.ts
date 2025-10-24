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
    const requiredFields = ['name', 'address', 'email', 'size', 'isPublic', 'status']
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

        if (!['active', 'inactive', 'prospect', 'prospect_contacted', 'appointment', 'no_approach', 'suspended', 'paused'].includes(rowData.status)) {
          result.errors.push(`行${i + 1}: ステータスが無効です`)
          continue
        }

        // 企業データを作成
        const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
          name: rowData.name.trim(),
          address: rowData.address?.trim() || '',
          email: rowData.email?.trim() || '',
          size: (rowData.size as 'startup' | 'small' | 'medium' | 'large' | 'enterprise') || 'small',
          isPublic: rowData.isPublic === 'true' || rowData.isPublic === '1',
          status: rowData.status as 'active' | 'inactive' | 'prospect' | 'prospect_contacted' | 'appointment' | 'no_approach' | 'suspended' | 'paused',
          // オプションフィールド
          employeeCount: rowData.employeeCount ? parseInt(rowData.employeeCount) : undefined,
          capital: rowData.capital ? parseInt(rowData.capital) : undefined,
          establishedYear: rowData.establishedYear ? parseInt(rowData.establishedYear) : undefined,
          representative: rowData.representative?.trim(),
          website: rowData.website?.trim(),
          phone: rowData.phone?.trim(),
          industry: rowData.industry?.trim(),
          businessType: rowData.businessType ? rowData.businessType.split(';').map(t => t.trim()).filter(Boolean) : undefined,
          feature1: rowData.feature1?.trim(),
          feature2: rowData.feature2?.trim(),
          feature3: rowData.feature3?.trim(),
          careerPath: rowData.careerPath?.trim(),
          youngRecruitReason: rowData.youngRecruitReason?.trim(),
          hasShokuninUnivRecord: rowData.hasShokuninUnivRecord === 'true' || rowData.hasShokuninUnivRecord === '1',
          hasHousingSupport: rowData.hasHousingSupport === 'true' || rowData.hasHousingSupport === '1',
          fullTimeAgeGroup: rowData.fullTimeAgeGroup?.trim(),
          independenceRecord: rowData.independenceRecord?.trim(),
          hasIndependenceSupport: rowData.hasIndependenceSupport === 'true' || rowData.hasIndependenceSupport === '1',
          contractStartDate: rowData.contractStartDate?.trim(),
          consultantId: rowData.consultantId?.trim(),
          memo: rowData.memo?.trim() || '',
          dominoId: rowData.dominoId?.trim(),
          importedAt: rowData.importedAt?.trim()
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

// CSVテンプレートを生成する関数
export const generateCompaniesCSVTemplate = (): string => {
  const headers = [
    'name',                    // 企業名（必須）
    'address',                 // 住所（必須）
    'email',                   // メールアドレス（必須）
    'size',                    // 企業規模（必須: startup/small/medium/large/enterprise）
    'isPublic',                // 公開状況（必須: true/false）
    'status',                  // ステータス（必須）
    'employeeCount',           // 従業員数
    'capital',                 // 資本金
    'establishedYear',         // 設立年
    'representative',          // 代表者名
    'website',                 // ウェブサイト
    'phone',                   // 電話番号
    'industry',                // 業界
    'businessType',            // 事業種別（セミコロン区切り）
    'feature1',                // 会社特徴1
    'feature2',                // 会社特徴2
    'feature3',                // 会社特徴3
    'careerPath',              // キャリアパス
    'youngRecruitReason',      // 若手入社理由
    'hasShokuninUnivRecord',   // 飲食人大学実績（true/false）
    'hasHousingSupport',       // 住宅支援（true/false）
    'fullTimeAgeGroup',        // 正社員年齢層
    'independenceRecord',      // 独立実績
    'hasIndependenceSupport',  // 独立支援（true/false）
    'contractStartDate',       // 取引開始日
    'consultantId',            // 担当コンサルタントID
    'memo',                    // メモ
    'dominoId',                // DominoID
    'importedAt'               // インポート日時
  ]

  const sampleData = [
    '株式会社サンプル',
    '東京都新宿区新宿1-1-1',
    'info@example.com',
    'small',
    'true',
    'active',
    '50',
    '1000',
    '2000',
    '田中太郎',
    'https://www.example.com',
    '03-1234-5678',
    'IT・サービス',
    'システム開発;コンサルティング',
    '最新技術の導入',
    '働きやすい環境',
    '成長できる職場',
    '海外就職可能',
    '技術力向上',
    'true',
    'true',
    '20代-30代',
    '3名独立',
    'true',
    '2023-01-01',
    'consultant-123',
    '優良企業です',
    'domino-123',
    '2023-12-01'
  ]

  return headers.join(',') + '\n' + sampleData.join(',')
}