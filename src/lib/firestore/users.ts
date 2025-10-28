import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User } from '@/types/user'

export const usersCollection = collection(db, 'users')

// 安全な日付変換関数
function safeToDate(value: any): Date {
  if (!value) return new Date()
  
  // Firestoreのタイムスタンプの場合
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate()
  }
  
  // 文字列の場合
  if (typeof value === 'string') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? new Date() : date
  }
  
  // Dateオブジェクトの場合
  if (value instanceof Date) {
    return value
  }
  
  return new Date()
}

// ユーザー一覧を取得
export async function getUsers(): Promise<User[]> {
  try {
    const q = query(usersCollection, orderBy('displayName', 'asc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        status: data.status,
        permissions: data.permissions || [],
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
        assignedCandidates: data.assignedCandidates,
        assignedCompanies: data.assignedCompanies,
        lastLoginAt: data.lastLoginAt ? (data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt) : undefined,
      } as User
    })
  } catch (error) {
    console.error('Error getting users:', error)
    throw error
  }
}

// アクティブなユーザーのみ取得
export async function getActiveUsers(): Promise<User[]> {
  try {
    const q = query(
      usersCollection, 
      where('status', '==', 'active'),
      orderBy('displayName', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        status: data.status,
        permissions: data.permissions || [],
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
        assignedCandidates: data.assignedCandidates,
        assignedCompanies: data.assignedCompanies,
        lastLoginAt: data.lastLoginAt ? (data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt) : undefined,
      } as User
    })
  } catch (error) {
    console.error('Error getting active users:', error)
    throw error
  }
}

// ユーザーIDから表示名を取得するためのマップを作成
export function createUserDisplayNameMap(users: User[]): Record<string, string> {
  return users.reduce((acc, user) => {
    acc[user.id] = user.displayName
    return acc
  }, {} as Record<string, string>)
}