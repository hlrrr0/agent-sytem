// Firebase認証問題の診断と修正ツール

export const diagnoseProblem = () => {
  if (typeof window === 'undefined') return

  console.group('🔍 Firebase Auth Diagnosis')
  
  // 現在のドメイン情報
  console.log('Current Domain:', window.location.origin)
  console.log('Current Hostname:', window.location.hostname)
  console.log('Protocol:', window.location.protocol)
  
  // Firebase設定
  console.log('Firebase Config:')
  console.log('- API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
  console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  
  // ブラウザ情報
  console.log('Browser Info:')
  console.log('- User Agent:', navigator.userAgent)
  console.log('- Cookies Enabled:', navigator.cookieEnabled)
  console.log('- Third-party Cookies:', document.cookie ? '✅ Available' : '⚠️ Blocked')
  
  // セキュリティ情報
  console.log('Security Context:')
  console.log('- HTTPS:', window.location.protocol === 'https:' ? '✅ Secure' : '❌ Insecure')
  console.log('- Same Origin:', window.location.origin.includes('vercel.app') ? '✅ Vercel' : '⚠️ Other')
  
  console.groupEnd()
}

export const testFirebaseConnection = async () => {
  try {
    // Firebase SDKのバージョン確認
    const { getApp } = await import('firebase/app')
    const app = getApp()
    console.log('✅ Firebase App initialized:', app.name)
    
    return true
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error)
    return false
  }
}