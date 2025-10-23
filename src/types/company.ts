// 企業関連の型定義
export interface Company {
  id: string
  
  // 基本情報
  name: string                              // 企業名（法人登記名または屋号）
  address: string                           // 所在地（都道府県・市区町村・番地）
  employeeCount?: number                    // 従業員数
  capital?: number                         // 資本金
  establishedYear?: number                 // 設立年（西暦）
  representative?: string                  // 代表者名
  website?: string                         // 公式HP URL
  logo?: string                           // ロゴ画像URL
  
  // 連絡先情報
  email: string                           // メールアドレス
  phone?: string                          // 電話番号
  
  // 企業分類
  industry?: string                       // 業界
  businessType?: string[]                 // 事業種別
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'  // 企業規模
  
  // 会社特徴
  feature1?: string                       // 会社特徴1
  feature2?: string                       // 会社特徴2  
  feature3?: string                       // 会社特徴3
  careerPath?: string                     // 目指せるキャリア（海外就職、海外独立、国内独立、経営層など）
  youngRecruitReason?: string             // 若手の入社理由
  
  // オプション情報
  hasShokuninUnivRecord?: boolean         // 飲食人大学就職実績の有無
  hasHousingSupport?: boolean             // 寮・家賃保証の有無
  fullTimeAgeGroup?: string               // 正社員年齢層
  independenceRecord?: string             // 独立実績
  hasIndependenceSupport?: boolean        // 独立支援の有無
  
  // 取引情報
  contractStartDate?: string | Date       // 取引開始日
  status: 'active' | 'inactive' | 'prospect' | 'prospect_contacted' | 'appointment' | 'no_approach' | 'suspended' | 'paused'  // 取引状況
  isPublic: boolean                       // 公開状況（公開／非公開）
  consultantId?: string                   // 担当コンサルタントID
  memo?: string                           // メモ・特記事項
  
  // メタデータ
  createdAt: string | Date
  updatedAt: string | Date
  
  // Dominoシステム連携
  dominoId?: string
  importedAt?: string | Date
}

export const companyStatusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  prospect: '見込み客',
  prospect_contacted: '見込み客/接触あり',
  appointment: 'アポ',
  no_approach: 'アプローチ不可',
  suspended: '停止',
  paused: '休止'
}

export const companySizeLabels = {
  startup: 'スタートアップ',
  small: '小企業',
  medium: '中企業',
  large: '大企業',
  enterprise: '大企業'
}

export const publicStatusLabels = {
  true: '公開',
  false: '非公開'
}