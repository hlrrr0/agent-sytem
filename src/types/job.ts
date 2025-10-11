// 求人票関連の型定義（要件定義対応版）

// 給与情報
export interface SalaryInfo {
  baseSalary?: number                      // 固定給
  type?: 'hourly' | 'daily' | 'monthly' | 'annual'  // 給与形態
  min?: number                            // 最低額
  max?: number                            // 最高額
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
  storeId?: string                        // 店舗ID（任意）
  
  // 基本情報
  title: string                           // 求人タイトル
  employmentType: 'full-time' | 'contract' | 'part-time' | 'temporary' | 'intern'  // 雇用区分
  
  // 給与・勤務条件
  salary: SalaryInfo                      // 給与情報
  workSchedule?: WorkSchedule             // 勤務時間・休日
  workingHours?: string                   // 勤務時間（簡易版）
  holidays?: string                       // 休日（簡易版）
  trialPeriod?: TrialPeriod              // 試用期間
  
  // 職務内容・スキル
  jobDescription?: string                 // 職務内容
  description?: string                    // 職務内容（別名）
  requiredSkills?: string                // 求めるスキル（握り／仕込み／焼き／接客／衛生等）
  preferredSkills?: string               // 歓迎スキル
  preferredQualifications?: string        // 歓迎条件
  
  // 福利厚生・応募条件
  benefits?: Benefits | string            // 福利厚生
  requirements?: ApplicationRequirements | string  // 応募条件
  
  // 応募情報
  applicationProcess?: string             // 応募方法
  applicationDeadline?: string | Date     // 応募締切
  contactInfo?: string                    // 連絡先
  startDate?: string | Date               // 勤務開始日
  location?: string                       // 勤務地
  
  // 特別条件
  isUrgent?: boolean                      // 急募フラグ
  isRemoteOk?: boolean                    // リモートOKフラグ
  
  // 公開設定
  visibility?: 'private' | 'limited' | 'public'  // 公開設定（非公開／限定公開／公開）
  
  // ステータス
  status: 'draft' | 'published' | 'active' | 'paused' | 'closed'  // 求人ステータス
  
  // メタデータ
  createdAt: string | Date
  updatedAt: string | Date
  createdBy?: string                      // 作成者ID
}

export const employmentTypeLabels = {
  'full-time': '正社員',
  'part-time': 'アルバイト・パート',
  'contract': '契約社員', 
  'temporary': '派遣社員',
  'intern': 'インターン'
}

export const visibilityLabels = {
  'private': '非公開（指名型）',
  'limited': '限定公開',
  'public': '公開'
}

export const jobStatusLabels = {
  'draft': '下書き',
  'published': '公開中',
  'active': '募集中',
  'paused': '一時停止',
  'closed': '募集終了'
}