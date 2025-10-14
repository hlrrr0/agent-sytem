"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User as FirebaseUser, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  signInWithGoogle: () => Promise<UserCredential | void>
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

    // リダイレクト結果を処理
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('Redirect sign-in successful:', result.user)
        }
      } catch (error: any) {
        console.error('Redirect result error:', error)
        // リダイレクト結果のエラーは無視（iframe の問題が続く可能性があるため）
        // 実際の認証状態は onAuthStateChanged で確認される
      }
    }

    // 少し遅延させてからリダイレクト結果を確認
    const timeoutId = setTimeout(handleRedirectResult, 1000)
    
    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const handleUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('handleUserProfile called for:', firebaseUser.email)
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        console.log('Existing user profile:', userData)
        setUserProfile(userData)
        
        // ログイン時刻を更新
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString()
        })
      } else {
        console.log('Creating new user profile for:', firebaseUser.email)
        // 新規ユーザーの場合、プロファイルを作成（承認待ち状態）
        let role: User['role'] = 'pending'
        
        // 開発環境では自動的に管理者権限を付与
        if (process.env.NODE_ENV === 'development' || 
            firebaseUser.email === 'hiroki.imai@super-shift.co.jp') {
          role = 'admin'
          console.log('Auto-approving user in development:', firebaseUser.email)
        }
        
        const newUserProfile: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          role,
          status: 'active',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await setDoc(userDocRef, newUserProfile)
        console.log('New user profile created:', newUserProfile)
        setUserProfile(newUserProfile)
      }
    } catch (error) {
      console.error('ユーザープロファイルの処理に失敗しました:', error)
    }
  }

  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      // カスタムパラメータを追加
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: '' // ドメイン制限を解除
      })
      
      console.log('Firebase Auth Domain:', auth.config.authDomain)
      console.log('Current Domain:', typeof window !== 'undefined' ? window.location.origin : 'SSR')
      
      // iframe の問題があるため、リダイレクト認証のみを使用
      console.log('Using redirect sign-in (iframe issues detected)...')
      await signInWithRedirect(auth, provider)
      return // リダイレクトの場合は結果はgetRedirectResultで処理
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