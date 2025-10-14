"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User as FirebaseUser, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types/user'

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signInWithGoogle: () => Promise<UserCredential>
  logout: () => Promise<void>
  isApproved: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // ユーザープロファイルを取得または作成
        await handleUserProfile(firebaseUser)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setUserProfile(userData)
        
        // ログイン時刻を更新
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString()
        })
      } else {
        // 新規ユーザーの場合、プロファイルを作成（承認待ち状態）
        const newUserProfile: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          role: 'pending',
          status: 'active',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await setDoc(userDocRef, newUserProfile)
        setUserProfile(newUserProfile)
      }
    } catch (error) {
      console.error('ユーザープロファイルの処理に失敗しました:', error)
    }
  }

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      // カスタムパラメータを追加してドメインの問題を回避
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      console.log('Firebase Auth Domain:', auth.config.authDomain)
      console.log('Current Domain:', typeof window !== 'undefined' ? window.location.origin : 'SSR')
      
      return await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error('signInWithGoogle error:', error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    return signOut(auth)
  }

  const isApproved = userProfile?.role === 'user' || userProfile?.role === 'admin'
  const isAdmin = userProfile?.role === 'admin'

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    isApproved,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}