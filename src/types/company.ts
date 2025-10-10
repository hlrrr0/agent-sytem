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
  
  // 会社特徴
  feature1?: string                       // 会社特徴1
  feature2?: string                       // 会社特徴2  
  feature3?: string                       // 会社特徴3
  
  // 取引情報
  contractStartDate?: string | Date       // 取引開始日
  status: 'active' | 'suspended' | 'paused'  // 取引状況（有効／停止／休止）
  isPublic: boolean                       // 公開状況（公開／非公開）
  consultantId?: string                   // 担当コンサルタントID
  
  // メタデータ
  createdAt: string | Date
  updatedAt: string | Date
  
  // Dominoシステム連携
  dominoId?: string
  importedAt?: string | Date
}

export const companyStatusLabels = {
  active: '有効',
  suspended: '停止',
  paused: '休止'
}

export const publicStatusLabels = {
  true: '公開',
  false: '非公開'
}