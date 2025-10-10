// 契約・請求管理の型定義

export interface Contract {
  id: string
  applicationId: string                    // 案件ID
  companyId: string                       // 企業ID
  candidateId: string                     // 候補者ID
  consultantId: string                    // 担当コンサルタントID
  
  // 契約基本情報
  contractType: 'success_fee' | 'installment'  // 成果報酬／分割払い
  
  // 料金設定
  fee: {
    calculationMethod: 'monthly_salary' | 'fixed_amount' | 'with_minimum'  // 算定方法
    monthlySalary?: number              // 月給（算定基準）
    multiplier?: number                 // 倍率（例：2ヶ月分）
    fixedAmount?: number               // 固定額
    minimumAmount?: number             // 下限額
    totalAmount: number                // 総額
  }
  
  // 分割払い設定（該当する場合）
  installment?: {
    numberOfPayments: number           // 分割回数
    paymentAmount: number              // 月払い額
    schedule: InstallmentSchedule[]    // 支払いスケジュール
  }
  
  // 返金規定
  refundPolicy: {
    enabled: boolean
    schedule: RefundSchedule[]         // 段階的返金スケジュール
  }
  
  // 契約書管理
  documents: {
    contractPdf?: string               // 契約書PDF URL
    signedDate?: string | Date         // 署名日
    isDigitallySigned?: boolean        // 電子署名フラグ
  }
  
  // 請求管理
  invoices: Invoice[]
  
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'refunded'
  
  createdAt: string | Date
  updatedAt: string | Date
  signedAt?: string | Date
}

export interface InstallmentSchedule {
  id: string
  paymentNumber: number                // 第n回
  dueDate: string | Date              // 支払期日
  amount: number                      // 支払額
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: string | Date            // 入金日
  invoiceId?: string                  // 請求書ID
}

export interface RefundSchedule {
  id: string
  periodStart: number                 // 期間開始（入社後n日）
  periodEnd: number                   // 期間終了（入社後n日）
  refundRate: number                  // 返金率（%）
  description?: string                // 説明
}

export interface Invoice {
  id: string
  contractId: string
  invoiceNumber: string               // 請求書番号
  issueDate: string | Date           // 発行日
  dueDate: string | Date             // 支払期日
  amount: number                     // 請求額
  taxAmount?: number                 // 消費税額
  totalAmount: number                // 総額
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: string | Date           // 入金日
  paymentMethod?: string             // 支払方法
  notes?: string                     // 備考
  
  // 書類
  pdfUrl?: string                    // 請求書PDF URL
  
  createdAt: string | Date
  updatedAt: string | Date
}

export const contractTypeLabels = {
  success_fee: '成果報酬',
  installment: '分割払い'
}

export const contractStatusLabels = {
  draft: '下書き',
  active: '有効',
  completed: '完了',
  cancelled: 'キャンセル',
  refunded: '返金済み'
}

export const invoiceStatusLabels = {
  draft: '下書き',
  sent: '送付済み',
  paid: '入金済み',
  overdue: '期限超過',
  cancelled: 'キャンセル'
}

export const installmentStatusLabels = {
  pending: '未払い',
  paid: '入金済み',
  overdue: '期限超過',
  cancelled: 'キャンセル'
}