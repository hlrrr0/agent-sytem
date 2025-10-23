export interface Store {
  id: string
  companyId: string              // 企業ID（外部キー）
  
  // 基本情報
  name: string                   // 店舗名
  address?: string               // 店舗住所
  website?: string               // 店舗URL
  unitPrice?: number             // 単価
  seatCount?: number             // 席数
  isReservationRequired?: boolean // 予約制なのか（時間固定の）
  instagramUrl?: string          // Instagram URL
  tabelogUrl?: string           // 食べログURL
  reputation?: string            // 食べログの口コミスコア / ミシュランなどの獲得状況等の実績
  staffReview?: string           // スタッフが食べに行った"正直な"感想
  trainingPeriod?: string        // 握れるまでの期間
  
  // 素材セクション
  ownerPhoto?: string            // 大将の写真
  ownerVideo?: string            // 大将の動画
  interiorPhoto?: string         // 店内の写真
  
  status: 'active' | 'inactive'  // 店舗ステータス
  createdAt: Date
  updatedAt: Date
}

export const statusLabels = {
  active: 'アクティブ',
  inactive: '非アクティブ'
}