// 求人票関連の型定義（要件定義対応版）

// 給与情報
export interface SalaryInfo {
  baseSalary?: number                      // 固定給
  commission?: boolean                     // 歩合制
  tips?: boolean                          // チップ制
  housingAllowance?: number               // 住宅手当
  transportationAllowance?: {             // 交通費支給
    provided: boolean                     // 支給有無
    maxAmount?: number                    // 上限額
  }
}

// 勤務時間・休日
export interface WorkSchedule {
  workingHours?: string                   // 勤務時間
  shiftType?: string                      // 勤務シフト
  weeklyHolidays?: number                 // 週休日数
  holidays?: string                       // 休日詳細
}

// 試用期間
export interface TrialPeriod {
  duration?: number                       // 期間（月）
  conditions?: string                     // 条件
  salaryDifference?: number               // 給与差異
}

// 福利厚生
export interface Benefits {
  socialInsurance?: boolean               // 社会保険
  uniform?: boolean                       // 制服
  meals?: boolean                         // 食事
  training?: boolean                      // 研修
  other?: string[]                        // その他
}

// 応募条件
export interface ApplicationRequirements {
  experienceYears?: number                // 経験年数
  requiredSkills?: string[]               // 必要スキル
  certifications?: string[]               // 資格
  languages?: string[]                    // 語学
  other?: string                          // その他条件
}

export interface Job {
  id: string
  
  // 関連ID
  companyId: string                       // 企業ID
  storeId: string                         // 店舗ID
  
  // 基本情報
  title: string                           // 求人タイトル
  employmentType: 'full-time' | 'contract' | 'part-time'  // 雇用区分（正社員／契約社員／アルバイト）
  
  // 給与・勤務条件
  salary: SalaryInfo                      // 給与情報
  workSchedule: WorkSchedule              // 勤務時間・休日
  trialPeriod?: TrialPeriod              // 試用期間
  
  // 職務内容・スキル
  jobDescription?: string                 // 職務内容
  requiredSkills?: string                // 求めるスキル（握り／仕込み／焼き／接客／衛生等）
  
  // 福利厚生・応募条件
  benefits?: Benefits                     // 福利厚生
  requirements?: ApplicationRequirements  // 応募条件
  
  // 公開設定
  visibility: 'private' | 'limited' | 'public'  // 公開設定（非公開／限定公開／公開）
  
  // ステータス
  status: 'draft' | 'active' | 'paused' | 'closed'  // 求人ステータス
  
  // メタデータ
  createdAt: string | Date
  updatedAt: string | Date
  createdBy?: string                      // 作成者ID
}

export const employmentTypeLabels = {
  'full-time': '正社員',
  'contract': '契約社員', 
  'part-time': 'アルバイト'
}

export const visibilityLabels = {
  'private': '非公開（指名型）',
  'limited': '限定公開',
  'public': '公開'
}

export const jobStatusLabels = {
  'draft': '下書き',
  'active': '募集中',
  'paused': '一時停止',
  'closed': '募集終了'
}