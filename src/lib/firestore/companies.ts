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
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types/company'

export const companiesCollection = collection(db, 'companies')

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

/**
 * 全企業を取得
 */
export async function getCompanies(): Promise<Company[]> {
  try {
    const q = query(companiesCollection, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    })) as Company[]
  } catch (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
}

/**
 * ステータス別企業を取得
 */
export async function getCompaniesByStatus(status: Company['status']): Promise<Company[]> {
  try {
    const q = query(
      companiesCollection, 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    })) as Company[]
  } catch (error) {
    console.error('Error fetching companies by status:', error)
    throw error
  }
}

/**
 * 企業をIDで取得
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const docRef = doc(companiesCollection, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Company
    }
    
    return null
  } catch (error) {
    console.error('Error fetching company:', error)
    throw error
  }
}

/**
 * 新規企業を作成
 */
export async function createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // undefinedフィールドを除去
    const cleanedData = removeUndefinedFields(companyData)
    
    const docRef = await addDoc(companiesCollection, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error creating company:', error)
    throw error
  }
}

/**
 * 企業情報を更新
 */
export async function updateCompany(id: string, companyData: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<void> {
  try {
    // undefinedフィールドを除去
    const cleanedData = removeUndefinedFields(companyData)
    
    const docRef = doc(companiesCollection, id)
    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating company:', error)
    throw error
  }
}

/**
 * 企業を削除
 */
export async function deleteCompany(id: string): Promise<void> {
  try {
    const docRef = doc(companiesCollection, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting company:', error)
    throw error
  }
}

/**
 * 企業名で検索
 */
export async function searchCompaniesByName(searchTerm: string): Promise<Company[]> {
  try {
    // Firestoreは部分一致検索が制限されているため、クライアントサイドでフィルタリング
    const allCompanies = await getCompanies()
    
    return allCompanies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching companies:', error)
    throw error
  }
}

/**
 * Dominoから取得したデータを一括インポート
 */
export async function importCompaniesFromDomino(companies: Company[]): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const company of companies) {
    try {
      // DominoIDで既存企業をチェック
      if (company.dominoId) {
        const q = query(companiesCollection, where('dominoId', '==', company.dominoId))
        const existing = await getDocs(q)
        
        if (!existing.empty) {
          // 既存企業を更新
          const existingDoc = existing.docs[0]
          await updateCompany(existingDoc.id, {
            ...company,
            importedAt: new Date(),
          })
        } else {
          // 新規企業を作成
          await createCompany({
            ...company,
            importedAt: new Date(),
          })
        }
      } else {
        // DominoIDがない場合は新規作成
        await createCompany({
          ...company,
          importedAt: new Date(),
        })
      }
      
      success++
    } catch (error) {
      failed++
      errors.push(`${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { success, failed, errors }
}

// 個別の企業取得
export const getCompany = async (id: string): Promise<Company | null> => {
  try {
    const docRef = doc(companiesCollection, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Company
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting company:', error)
    throw error
  }
}