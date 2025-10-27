import { NextRequest, NextResponse } from 'next/server'

/**
 * Domino API 認証テスト - 複数の認証方式を順次試す
 */
export async function GET(request: NextRequest) {
  try {
    const dominoApiUrl = process.env.DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
    const dominoApiKey = process.env.DOMINO_API_KEY || 'your-hr-api-secret-key'
    
    console.log('🔐 認証テスト開始:', {
      apiUrl: dominoApiUrl,
      hasApiKey: !!dominoApiKey,
      apiKeyLength: dominoApiKey?.length
    })
    
    const testResults = []
    
    // テスト1: Bearer token
    try {
      console.log('🧪 テスト1: Bearer token')
      const response1 = await fetch(`${dominoApiUrl}/companies?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${dominoApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      testResults.push({
        method: 'Bearer token',
        status: response1.status,
        ok: response1.ok,
        statusText: response1.statusText,
        headers: Object.fromEntries(response1.headers.entries())
      })
      
      if (response1.ok) {
        const data = await response1.json()
        return NextResponse.json({
          success: true,
          workingMethod: 'Bearer token',
          data,
          allTests: testResults
        })
      }
    } catch (error) {
      testResults.push({
        method: 'Bearer token',
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // テスト2: X-API-Key ヘッダー
    try {
      console.log('🧪 テスト2: X-API-Key ヘッダー')
      const response2 = await fetch(`${dominoApiUrl}/companies?limit=1`, {
        method: 'GET',
        headers: {
          'X-API-Key': dominoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      testResults.push({
        method: 'X-API-Key header',
        status: response2.status,
        ok: response2.ok,
        statusText: response2.statusText,
        headers: Object.fromEntries(response2.headers.entries())
      })
      
      if (response2.ok) {
        const data = await response2.json()
        return NextResponse.json({
          success: true,
          workingMethod: 'X-API-Key header',
          data,
          allTests: testResults
        })
      }
    } catch (error) {
      testResults.push({
        method: 'X-API-Key header',
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // テスト3: api_key クエリパラメータ
    try {
      console.log('🧪 テスト3: api_key クエリパラメータ')
      const response3 = await fetch(`${dominoApiUrl}/companies?limit=1&api_key=${dominoApiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      testResults.push({
        method: 'api_key parameter',
        status: response3.status,
        ok: response3.ok,
        statusText: response3.statusText,
        headers: Object.fromEntries(response3.headers.entries())
      })
      
      if (response3.ok) {
        const data = await response3.json()
        return NextResponse.json({
          success: true,
          workingMethod: 'api_key parameter',
          data,
          allTests: testResults
        })
      }
    } catch (error) {
      testResults.push({
        method: 'api_key parameter',
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // テスト4: 認証なし（パブリックAPI確認）
    try {
      console.log('🧪 テスト4: 認証なし')
      const response4 = await fetch(`${dominoApiUrl}/companies?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      testResults.push({
        method: 'No authentication',
        status: response4.status,
        ok: response4.ok,
        statusText: response4.statusText,
        headers: Object.fromEntries(response4.headers.entries())
      })
      
      if (response4.ok) {
        const data = await response4.json()
        return NextResponse.json({
          success: true,
          workingMethod: 'No authentication (public API)',
          data,
          allTests: testResults
        })
      }
    } catch (error) {
      testResults.push({
        method: 'No authentication',
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // すべてのテストが失敗
    return NextResponse.json({
      success: false,
      message: 'すべての認証方式が失敗しました',
      allTests: testResults
    }, { status: 401 })
    
  } catch (error) {
    console.error('❌ 認証テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'Authentication test failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}