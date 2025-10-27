import { NextRequest, NextResponse } from 'next/server'

/**
 * Domino API プロキシ - CORS問題を回避するため
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // クエリパラメータを取得
    const status = searchParams.get('status')
    const sizeCategory = searchParams.get('sizeCategory')
    const limit = searchParams.get('limit') || '10'
    const offset = searchParams.get('offset') || '0'
    
    // Domino APIのURL
    const dominoApiUrl = process.env.DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
    const dominoApiKey = process.env.DOMINO_API_KEY || 'your-hr-api-secret-key'
    
    console.log('🔧 サーバーサイド環境変数確認:', {
      DOMINO_API_URL: process.env.DOMINO_API_URL,
      DOMINO_API_KEY: process.env.DOMINO_API_KEY ? process.env.DOMINO_API_KEY.substring(0, 8) + '...' : '未設定',
      dominoApiUrl,
      dominoApiKey: dominoApiKey ? dominoApiKey.substring(0, 8) + '...' : '未設定'
    })
    
    // クエリパラメータを構築（api_keyも追加）
    const params = new URLSearchParams({
      limit,
      offset,
      api_key: dominoApiKey, // クエリパラメータとしてAPIキーを追加
    })
    
    // オプションパラメータは値がある場合のみ追加
    if (status && status !== 'active') {
      params.append('status', status)
    }
    
    if (sizeCategory && sizeCategory !== 'all' && sizeCategory !== '') {
      params.append('sizeCategory', sizeCategory)
    }
    
    console.log('🔗 クエリパラメータ詳細:', {
      limit,
      offset,
      status: status || '(未指定)',
      sizeCategory: sizeCategory || '(未指定)',
      api_key: dominoApiKey ? dominoApiKey.substring(0, 8) + '...' : '未設定',
      fullParams: params.toString()
    })
    
    const targetUrl = `${dominoApiUrl}/companies?${params}`
    
    console.log('🔄 Domino APIプロキシ呼び出し:', {
      targetUrl, // 実際のURLをそのまま表示（デバッグ用）
      targetUrlMasked: targetUrl.replace(dominoApiKey, '***API_KEY***'), // マスク版も表示
      hasApiKey: !!dominoApiKey,
      apiKeyLength: dominoApiKey?.length,
      apiKeyPrefix: dominoApiKey?.substring(0, 8) + '...',
      apiKeyValue: dominoApiKey, // デバッグ用：実際のAPIキー値
      authMethods: ['Bearer token', 'X-API-Key header', 'api_key parameter']
    })
    
    // 複数の認証方法を試す
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    // Bearer token として設定
    if (dominoApiKey) {
      authHeaders['Authorization'] = `Bearer ${dominoApiKey}`
      authHeaders['X-API-Key'] = dominoApiKey // ヘッダーとしても送信
    }
    
    console.log('📤 送信ヘッダー:', {
      ...authHeaders,
      'Authorization': authHeaders['Authorization'] ? authHeaders['Authorization'].substring(0, 15) + '...' : undefined,
      'X-API-Key': authHeaders['X-API-Key'] ? authHeaders['X-API-Key'].substring(0, 8) + '...' : undefined
    })
    
    // Domino APIを呼び出し
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: authHeaders
    })
    
    console.log('📡 Domino APIレスポンス:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Domino APIエラー:', errorText)
      return NextResponse.json(
        { error: `Domino API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('📊 Domino APIデータ:', data)
    
    // CORSヘッダーを設定してレスポンス
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
      }
    })
    
  } catch (error) {
    console.error('❌ プロキシエラー:', error)
    return NextResponse.json(
      { error: 'Proxy Error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
    }
  })
}