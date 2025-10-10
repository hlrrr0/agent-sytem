// 求職者関連の型定義（要件定義対応版）

// 希望条件
export interface JobPreferences {
  workLocation?: string[]                   // 希望勤務地
  salary?: {
    min?: number                            // 最低希望給与
    max?: number                           // 最高希望給与
  }
  workStyle?: string[]                      // 希望勤務形態
}

// 職歴
export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string | Date
  endDate?: string | Date
  isCurrent: boolean
  description?: string
  achievements?: string[]
}

// 学歴
export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string | Date
  endDate?: string | Date
  isCurrent: boolean
  gpa?: number
}

// 資格
export interface Certification {
  id: string
  name: string
  issuer: string
  dateIssued: string | Date
  expiryDate?: string | Date
  credentialId?: string
}

export interface Candidate {
  id: string
  
  // 基本情報
  firstName: string                         // 名
  lastName: string                          // 姓
  firstNameKana: string                     // 名（カナ）
  lastNameKana: string                      // 姓（カナ）
  email: string
  phone?: string
  dateOfBirth?: string | Date              // 生年月日
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  
  // 飲食人大学情報
  enrollmentMonth?: string                  // 入学月
  campus?: string                          // 入学校舎
  
  // 連絡先情報
  contactMethods?: {
    phone?: string                          // 電話番号
    email?: string                         // メールアドレス
    line?: string                          // LINE
    other?: string                         // その他
  }
  
  // 職歴情報
  experience: WorkExperience[]
  
  // 学歴情報
  education: Education[]
  
  // スキル・資格
  skills: string[]
  certifications: Certification[]
  
  // 希望条件
  preferences: JobPreferences
  
  // ポートフォリオ・履歴
  portfolio?: {
    photos?: string[]                       // 写真
    videos?: string[]                       // 動画
    skillVideoLinks?: string[]              // 技能動画リンク
  }
  
  // コメント・評価
  consultantComment?: string                // コンサル作成の紹介文
  instructorComment?: string                // 講師コメント
  
  // ステータス
  status: 'active' | 'inactive' | 'placed' | 'interviewing'
  
  // メタデータ
  createdAt: string | Date
  updatedAt: string | Date
  lastContactDate?: string | Date
  assignedRecruiter?: string
  
  // 書類
  resumeUrl?: string                        // 履歴書
  portfolioUrl?: string                     // ポートフォリオ
  workHistoryUrl?: string                   // 職務経歴書
  recommendationUrl?: string                // 推薦状
  notes?: string
}

export const candidateStatusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  placed: '就職済み',
  interviewing: '面接中'
}