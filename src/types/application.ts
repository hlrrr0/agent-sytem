// アプリケーション（案件）関連の型定義

export interface Application {
  id: string
  jobId: string                            // 求人ID
  candidateId: string                      // 候補者ID
  consultantId: string                     // 担当コンサルタントID
  
  // パイプラインステージ
  stage: ApplicationStage
  stageHistory: StageHistory[]             // ステージ履歴
  
  // 面談・面接記録
  interviews: Interview[]
  
  // メモ・記録
  notes?: string
  internalNotes?: string                   // 内部メモ
  
  // ステータス
  status: 'active' | 'inactive' | 'completed' | 'cancelled'
  
  createdAt: string | Date
  updatedAt: string | Date
}

export type ApplicationStage = 
  | 'scout'           // スカウト
  | 'first_interview' // 初回面談
  | 'follow_up'       // n回目面談
  | 'recommended'     // 推薦
  | 'company_interview' // 面接
  | 'offer'           // 内定
  | 'hired'           // 入社
  | 'follow_up_3m'    // 定着確認（3ヶ月）
  | 'follow_up_6m'    // 定着確認（6ヶ月）
  | 'follow_up_12m'   // 定着確認（12ヶ月）

export interface StageHistory {
  id: string
  stage: ApplicationStage
  startDate: string | Date
  endDate?: string | Date
  notes?: string
  result?: 'success' | 'failure' | 'pending'
}

export interface Interview {
  id: string
  type: 'consultant' | 'company'          // 面談タイプ
  date: string | Date
  duration?: number                        // 時間（分）
  location?: string                        // 場所
  attendees: string[]                      // 参加者
  notes?: string                          // 面談メモ
  feedback?: string                       // フィードバック
  result?: 'positive' | 'negative' | 'neutral'
  nextSteps?: string                      // 次のステップ
}

export const stageLabels = {
  scout: 'スカウト',
  first_interview: '初回面談',
  follow_up: 'フォロー面談',
  recommended: '推薦',
  company_interview: '企業面接',
  offer: '内定',
  hired: '入社',
  follow_up_3m: '定着確認（3ヶ月）',
  follow_up_6m: '定着確認（6ヶ月）',
  follow_up_12m: '定着確認（12ヶ月）'
}

export const applicationStatusLabels = {
  active: '進行中',
  inactive: '停止中',
  completed: '完了',
  cancelled: 'キャンセル'
}