export interface Store {
  id: string
  companyId: string              // 企業ID（外部キー）
  name: string                   // 店舗名
  address: string                // 所在地
  businessType: 'kaiten' | 'counter_alacarte' | 'counter_omakase' | 'other'  // 業態
  website?: string               // 公式HP
  tabelogUrl?: string           // 食べログURL
  instagramUrl?: string         // Instagram URL
  status: 'open' | 'closed'     // 取引状況（営業中／閉店）
  createdAt: Date
  updatedAt: Date
}

export const businessTypeLabels = {
  kaiten: '回転寿司',
  counter_alacarte: 'カウンター寿司（アラカルト）',
  counter_omakase: 'カウンター寿司（おまかせ）',
  other: 'その他'
}

export const statusLabels = {
  open: '営業中',
  closed: '閉店'
}