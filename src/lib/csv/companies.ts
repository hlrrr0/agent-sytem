import { Company } from '@/types/company'
import { createCompany, updateCompany, findCompanyByNameAndAddress } from '@/lib/firestore/companies'

export interface ImportResult {
  success: number
  updated: number
  errors: string[]
}

export const importCompaniesFromCSV = async (csvText: string): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    updated: 0,
    errors: []
  }

  try {
    // CSV解析 - 複数行にわたるフィールドに対応
    const lines = []
    let currentLine = ''
    let inQuotes = false
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i]
      
      if (char === '"') {
        if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
          // エスケープされた引用符
          currentLine += '""'
          i++ // 次の引用符をスキップ
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes
          currentLine += char
        }
      } else if (char === '\n' && !inQuotes) {
        // 行の終了（引用符内でない場合のみ）
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
        }
        currentLine = ''
      } else if (char === '\r') {
        // キャリッジリターンは無視
        continue
      } else {
        currentLine += char
      }
    }
    
    // 最後の行を追加
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }
    
    if (lines.length < 2) {
      result.errors.push('CSVファイルにデータが含まれていません')
      return result
    }

    // 日本語ヘッダーから英語フィールド名へのマッピング
    const headerMapping: Record<string, string> = {
      '企業名': 'name',
      '住所': 'address',
      'メールアドレス': 'email',
      '企業規模': 'size',
      '公開状況': 'isPublic',
      'ステータス': 'status',
      '従業員数': 'employeeCount',
      '資本金': 'capital',
      '設立年': 'establishedYear',
      '代表者名': 'representative',
      'ウェブサイト': 'website',
      'ロゴURL': 'logo',
      '電話番号': 'phone',
      '会社特徴1': 'feature1',
      '会社特徴2': 'feature2',
      '会社特徴3': 'feature3',
      'キャリアパス': 'careerPath',
      '若手入社理由': 'youngRecruitReason',
      '飲食人大学実績': 'hasShokuninUnivRecord',
      '住宅支援': 'hasHousingSupport',
      '正社員年齢層': 'fullTimeAgeGroup',
      '独立実績': 'independenceRecord',
      '独立支援': 'hasIndependenceSupport',
      '取引開始日': 'contractStartDate',
      '担当コンサルタントID': 'consultantId',
      'メモ': 'memo',
      'DominoID': 'dominoId',
      'インポート日時': 'importedAt'
    }

    // ヘッダー行を取得（日本語と英語の両方に対応）
    const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const headers = originalHeaders.map(header => headerMapping[header] || header)
    
    // 必須フィールドの確認（英語フィールド名で）
    const requiredFields = ['name', 'address', 'email', 'size', 'status']
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
        
        // デバッグ情報を追加
        if (i === 1) {
          console.log('期待ヘッダー数:', headers.length)
          console.log('実際のフィールド数:', values.length)
          console.log('ヘッダー:', headers)
          console.log('最初のデータ行:', values)
        }
        
        if (values.length !== headers.length) {
          // フィールド数が一致しない場合、不足分を空文字で埋める
          while (values.length < headers.length) {
            values.push('')
          }
          // 余分なフィールドは切り捨て
          if (values.length > headers.length) {
            values.splice(headers.length)
          }
          
          console.warn(`行${i + 1}: フィールド数を調整しました (期待: ${headers.length}, 実際: ${parseCSVLine(lines[i]).length})`)
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
          isPublic: rowData.isPublic ? (rowData.isPublic === 'true' || rowData.isPublic === '1') : false,
          status: (['active', 'inactive', 'prospect', 'prospect_contacted', 'appointment', 'no_approach', 'suspended', 'paused'].includes(rowData.status)) 
            ? rowData.status as Company['status'] 
            : 'active',
          // オプションフィールド
          employeeCount: rowData.employeeCount ? parseInt(rowData.employeeCount) : undefined,
          capital: rowData.capital ? parseInt(rowData.capital) : undefined,
          establishedYear: rowData.establishedYear ? parseInt(rowData.establishedYear) : undefined,
          representative: rowData.representative?.trim(),
          website: rowData.website?.trim(),
          phone: rowData.phone?.trim(),
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

        // 重複チェック：企業名と住所の組み合わせで既存企業を検索
        const existingCompany = await findCompanyByNameAndAddress(
          companyData.name, 
          companyData.address
        )

        if (existingCompany) {
          // 既存企業が見つかった場合は更新
          await updateCompany(existingCompany.id, companyData)
          result.updated++
          console.log(`行${i + 1}: 既存企業「${companyData.name}」を更新しました`)
        } else {
          // 新規企業として作成
          await createCompany(companyData)
          result.success++
          console.log(`行${i + 1}: 新規企業「${companyData.name}」を作成しました`)
        }

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
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++ // 次の引用符をスキップ
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // 最後のフィールドを追加
  result.push(current)
  
  return result
}

// CSVテンプレートを生成する関数
export const generateCompaniesCSVTemplate = (): string => {
  // 日本語ヘッダーと対応する英語フィールド名のマッピング
  const headerMapping = [
    { jp: '企業名', en: 'name' },                            // 必須
    { jp: '住所', en: 'address' },                           // 必須
    { jp: 'メールアドレス', en: 'email' },                   // 必須
    { jp: '企業規模', en: 'size' },                          // 必須: startup/small/medium/large/enterprise
    { jp: '公開状況', en: 'isPublic' },                      // 必須: true/false
    { jp: 'ステータス', en: 'status' },                      // 必須: active/inactive/prospect/prospect_contacted/appointment/no_approach/suspended/paused
    { jp: '従業員数', en: 'employeeCount' },
    { jp: '資本金', en: 'capital' },
    { jp: '設立年', en: 'establishedYear' },
    { jp: '代表者名', en: 'representative' },
    { jp: 'ウェブサイト', en: 'website' },
    { jp: 'ロゴURL', en: 'logo' },
    { jp: '電話番号', en: 'phone' },
    { jp: '会社特徴1', en: 'feature1' },
    { jp: '会社特徴2', en: 'feature2' },
    { jp: '会社特徴3', en: 'feature3' },
    { jp: 'キャリアパス', en: 'careerPath' },
    { jp: '若手入社理由', en: 'youngRecruitReason' },
    { jp: '飲食人大学実績', en: 'hasShokuninUnivRecord' },   // true/false
    { jp: '住宅支援', en: 'hasHousingSupport' },             // true/false
    { jp: '正社員年齢層', en: 'fullTimeAgeGroup' },
    { jp: '独立実績', en: 'independenceRecord' },
    { jp: '独立支援', en: 'hasIndependenceSupport' },        // true/false
    { jp: '取引開始日', en: 'contractStartDate' },           // YYYY-MM-DD形式
    { jp: '担当コンサルタントID', en: 'consultantId' },
    { jp: 'メモ', en: 'memo' },
    { jp: 'DominoID', en: 'dominoId' },
    { jp: 'インポート日時', en: 'importedAt' }               // YYYY-MM-DD形式
  ]

  // 日本語ヘッダー行を生成
  const jpHeaders = headerMapping.map(item => item.jp)
  
  // サンプルデータ（日本語ヘッダーに対応）
  const sampleData = [
    '株式会社サンプル企業',                    // 企業名
    '東京都新宿区新宿1-1-1 サンプルビル3F',    // 住所
    'info@sample-company.co.jp',            // メールアドレス
    'small',                                // 企業規模（startup/small/medium/large/enterprise）
    'true',                                 // 公開状況（true/false）
    'active',                               // ステータス（active/inactive/prospect/prospect_contacted/appointment/no_approach/suspended/paused）
    '50',                                   // 従業員数
    '10000000',                             // 資本金（円）
    '2000',                                 // 設立年
    '田中太郎',                             // 代表者名
    'https://www.sample-company.co.jp',     // ウェブサイト
    'https://example.com/logo.png',         // ロゴURL
    '03-1234-5678',                         // 電話番号
    '最新技術の積極的な導入',                // 会社特徴1
    '働きやすい環境づくり',                  // 会社特徴2
    '社員の成長を重視',                     // 会社特徴3
    '海外就職・海外独立・経営層',            // キャリアパス
    '技術力向上と専門性獲得',                // 若手入社理由
    'true',                                 // 飲食人大学実績（true/false）
    'true',                                 // 住宅支援（true/false）
    '20代-40代中心',                        // 正社員年齢層
    '過去3年で5名が独立',                   // 独立実績
    'true',                                 // 独立支援（true/false）
    '2023-04-01',                           // 取引開始日（YYYY-MM-DD）
    'consultant-001',                       // 担当コンサルタントID
    '優良な取引先企業。成長意欲の高い人材を求めている。', // メモ
    'domino-sample-001',                    // DominoID
    '2024-10-24'                            // インポート日時（YYYY-MM-DD）
  ]

  // CSV形式で返す（日本語ヘッダー + サンプルデータ）
  return jpHeaders.join(',') + '\n' + sampleData.map(value => 
    value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value
  ).join(',')
}