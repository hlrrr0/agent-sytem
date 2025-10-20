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
  try {
    const data = doc.data()
    console.log('🔄 変換中のドキュメント ID:', doc.id, 'データ:', data)
    
    const result = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      // 必須フィールドのデフォルト値を確保
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      firstNameKana: data.firstNameKana || '',
      lastNameKana: data.lastNameKana || '',
      email: data.email || '',
      status: data.status || 'active',
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || [],
      certifications: data.certifications || [],
      preferences: data.preferences || {}
    } as Candidate
    
    console.log('✅ 変換完了:', result)
    return result
  } catch (error) {
    console.error('❌ 求職者データ変換エラー ID:', doc.id, error)
    // エラーでも基本的な構造を返す
    return {
      id: doc.id,
      firstName: 'データエラー',
      lastName: '',
      firstNameKana: '',
      lastNameKana: '',
      email: '',
      status: 'active',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date()
    } as Candidate
  }
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
    console.log('🔍 getCandidates開始', options)
    
    // 一時的に最もシンプルなクエリでテスト
    console.log('⚠️ 一時的にシンプルクエリでテスト中')
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))
    console.log('📋 Firestoreから取得したドキュメント数:', snapshot.docs.length)
    
    if (snapshot.docs.length === 0) {
      console.log('❌ Firestoreにドキュメントが存在しません')
      return []
    }
    
    // 生データを確認
    const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log('📋 生データサンプル:', rawData[0])
    
    let candidates = snapshot.docs.map(candidateFromFirestore)
    console.log('🔄 変換後の求職者データ:', candidates)
    
    if (candidates.length === 0) {
      console.log('❌ 変換後にデータが0件になりました')
    }
    
    console.log('✅ getCandidates完了 返却データ件数:', candidates.length)
    return candidates
  } catch (error) {
    console.error('❌ getCandidatesエラー:', error)
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

// 個別の候補者取得
export const getCandidate = async (id: string): Promise<Candidate | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return candidateFromFirestore(docSnap)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting candidate:', error)
    throw error
  }
}