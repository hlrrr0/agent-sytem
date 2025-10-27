import { NextRequest, NextResponse } from 'next/server'

/**
 * Domino API接続テスト用エンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const dominoApiUrl = process.env.DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
    const dominoApiKey = process.env.DOMINO_API_KEY || 'your-hr-api-secret-key'
    
    console.log('🧪 Domino API接続テスト開始')
    console.log('🔧 設定情報:', {
      url: dominoApiUrl,
      hasApiKey: !!dominoApiKey,
      apiKeyLength: dominoApiKey?.length,
      apiKeyPrefix: dominoApiKey?.substring(0, 8) + '...'
    })
    
    // シンプルなテスト呼び出し
    const testUrl = `${dominoApiUrl}/companies?limit=1&offset=0&api_key=${dominoApiKey}`
    
    console.log('📡 テスト呼び出し URL:', testUrl.replace(dominoApiKey, '***API_KEY***'))
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${dominoApiKey}`,
        'X-API-Key': dominoApiKey
      }
    })
    
    console.log('📊 テスト結果:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    const responseText = await response.text()
    console.log('📝 レスポンステキスト:', responseText)
    
    let responseData: any = null
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.warn('⚠️ レスポンスがJSONではありません')
    }
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseText,
      responseData,
      config: {
        url: dominoApiUrl,
        hasApiKey: !!dominoApiKey,
        apiKeyLength: dominoApiKey?.length
      }
    })
    
  } catch (error) {
    console.error('❌ 接続テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}