// 求職者関連のFirestore操作
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Candidate } from '@/types/candidate'

const COLLECTION_NAME = 'candidates'

// undefinedフィールドを深くネストされたオブジェクトからも除去するヘルパー関数
function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)).filter(item => item !== undefined)
  }
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && value.constructor === Object) {
        const nestedCleaned = removeUndefinedFields(value)
        // 空のオブジェクトでなければ追加
        if (Object.keys(nestedCleaned).length > 0) {
          cleaned[key] = nestedCleaned
        }
      } else if (Array.isArray(value)) {
        const cleanedArray = removeUndefinedFields(value)
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray
        }
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

// Firestore用のデータ変換（Date型をTimestamp型に変換）
const candidateToFirestore = (candidate: Omit<Candidate, 'id'>) => {
  return {
    ...candidate,
    createdAt: candidate.createdAt instanceof Date 
      ? Timestamp.fromDate(candidate.createdAt) 
      : Timestamp.fromDate(new Date(candidate.createdAt)),
    updatedAt: candidate.updatedAt instanceof Date 
      ? Timestamp.fromDate(candidate.updatedAt) 
      : Timestamp.fromDate(new Date(candidate.updatedAt))
  }
}

// Firestoreからのデータ変換（Timestamp型をDate型に変換）
const candidateFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Candidate => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Candidate
}

// 求職者一覧取得（フィルタリング・ソート対応）
export const getCandidates = async (options?: {
  status?: Candidate['status']
  searchTerm?: string
  limit?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'lastName'
  orderDirection?: 'asc' | 'desc'
}): Promise<Candidate[]> => {
  try {
    let baseQuery = collection(db, COLLECTION_NAME)
    let constraints = []
    
    // フィルタリング
    if (options?.status) {
      constraints.push(where('status', '==', options.status))
    }
    
    // ソート
    const orderByField = options?.orderBy || 'updatedAt'
    const orderDirection = options?.orderDirection || 'desc'
    constraints.push(orderBy(orderByField, orderDirection))
    
    // 制限
    if (options?.limit) {
      constraints.push(limit(options.limit))
    }
    
    const q = query(baseQuery, ...constraints)
    const snapshot = await getDocs(q)
    let candidates = snapshot.docs.map(candidateFromFirestore)
    
    // 検索フィルタ（クライアントサイド）
    if (options?.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase()
      candidates = candidates.filter(candidate => 
        `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchLower) ||
        `${candidate.firstNameKana} ${candidate.lastNameKana}`.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.phone?.toLowerCase().includes(searchLower) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchLower))
      )
    }
    
    return candidates
  } catch (error) {
    console.error('Error getting candidates:', error)
    throw error
  }
}

// 求職者詳細取得
export const getCandidateById = async (id: string): Promise<Candidate | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return candidateFromFirestore(docSnap as QueryDocumentSnapshot<DocumentData>)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting candidate:', error)
    throw error
  }
}

// 求職者作成
export const createCandidate = async (candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date()
    const candidate = candidateToFirestore({
      ...candidateData,
      createdAt: now,
      updatedAt: now
    })
    
    // undefinedフィールドを除去
    const cleanedCandidate = removeUndefinedFields(candidate)
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanedCandidate)
    return docRef.id
  } catch (error) {
    console.error('Error creating candidate:', error)
    throw error
  }
}

// 求職者更新
export const updateCandidate = async (id: string, candidateData: Partial<Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData = candidateToFirestore({
      ...candidateData,
      updatedAt: new Date()
    } as Omit<Candidate, 'id'>)
    
    // undefinedフィールドを除去
    const cleanedUpdateData = removeUndefinedFields(updateData)
    
    await updateDoc(docRef, cleanedUpdateData)
  } catch (error) {
    console.error('Error updating candidate:', error)
    throw error
  }
}

// 求職者削除
export const deleteCandidate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting candidate:', error)
    throw error
  }
}

// 経験年数別求職者取得（職歴から算出）
export const getCandidatesByExperienceYears = async (minYears: number): Promise<Candidate[]> => {
  try {
    const candidates = await getCandidates()
    
    return candidates.filter(candidate => {
      const totalYears = candidate.experience.reduce((total, exp) => {
        const startDate = new Date(exp.startDate)
        const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
        const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        return total + years
      }, 0)
      
      return totalYears >= minYears
    })
  } catch (error) {
    console.error('Error getting candidates by experience years:', error)
    throw error
  }
}

// ステータス別求職者取得
export const getCandidatesByStatus = async (status: Candidate['status']): Promise<Candidate[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(candidateFromFirestore)
  } catch (error) {
    console.error('Error getting candidates by status:', error)
    throw error
  }
}

// 求職者統計取得
export const getCandidateStats = async () => {
  try {
    const candidates = await getCandidates()
    
    const stats = {
      total: candidates.length,
      byStatus: {
        active: candidates.filter(c => c.status === 'active').length,
        inactive: candidates.filter(c => c.status === 'inactive').length,
        placed: candidates.filter(c => c.status === 'placed').length,
        interviewing: candidates.filter(c => c.status === 'interviewing').length
      },
      byExperienceYears: {
        novice: candidates.filter(c => {
          const totalYears = c.experience.reduce((total, exp) => {
            const startDate = new Date(exp.startDate)
            const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
            const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return total + years
          }, 0)
          return totalYears < 1
        }).length,
        junior: candidates.filter(c => {
          const totalYears = c.experience.reduce((total, exp) => {
            const startDate = new Date(exp.startDate)
            const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
            const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return total + years
          }, 0)
          return totalYears >= 1 && totalYears < 3
        }).length,
        mid: candidates.filter(c => {
          const totalYears = c.experience.reduce((total, exp) => {
            const startDate = new Date(exp.startDate)
            const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
            const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return total + years
          }, 0)
          return totalYears >= 3 && totalYears < 5
        }).length,
        senior: candidates.filter(c => {
          const totalYears = c.experience.reduce((total, exp) => {
            const startDate = new Date(exp.startDate)
            const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
            const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return total + years
          }, 0)
          return totalYears >= 5
        }).length
      }
    }
    
    return stats
  } catch (error) {
    console.error('Error getting candidate stats:', error)
    throw error
  }
}