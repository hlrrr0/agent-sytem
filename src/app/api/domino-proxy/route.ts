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
    const updatedAfter = searchParams.get('updatedAfter') || searchParams.get('since')
    const updatedUntil = searchParams.get('updatedUntil') || searchParams.get('until')
    const includeEmpty = searchParams.get('includeEmpty') // 空白の更新日時を含むかどうか
    
    // Domino APIのURL
    const dominoApiUrl = process.env.DOMINO_API_URL || 'https://sushi-domino.vercel.app/api/hr-export'
    const dominoApiKey = process.env.DOMINO_API_KEY || 'your-hr-api-secret-key'
    
    // 環境変数の検証
    if (!process.env.DOMINO_API_URL) {
      console.error('❌ DOMINO_API_URL が設定されていません')
      return NextResponse.json(
        { error: 'DOMINO_API_URL環境変数が設定されていません' },
        { status: 500 }
      )
    }
    if (!process.env.DOMINO_API_KEY) {
      console.error('❌ DOMINO_API_KEY が設定されていません')
      return NextResponse.json(
        { error: 'DOMINO_API_KEY環境変数が設定されていません' },
        { status: 500 }
      )
    }
    if (dominoApiKey === 'your-hr-api-secret-key') {
      console.error('❌ DOMINO_API_KEY がデフォルト値のままです')
      return NextResponse.json(
        { error: 'DOMINO_API_KEY環境変数がデフォルト値のままです' },
        { status: 500 }
      )
    }
    
    console.log('🔧 サーバーサイド環境変数確認:', {
      DOMINO_API_URL: process.env.DOMINO_API_URL,
      DOMINO_API_KEY_SET: !!process.env.DOMINO_API_KEY,
      DOMINO_API_KEY_LENGTH: process.env.DOMINO_API_KEY?.length,
      DOMINO_API_KEY_PREFIX: process.env.DOMINO_API_KEY?.substring(0, 8) + '...',
      dominoApiUrl,
      envFileExists: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('DOMINO'))
    })
    
    // クエリパラメータを構築（api_keyも追加）
    const params = new URLSearchParams({
      limit,
      offset,
      api_key: dominoApiKey, // クエリパラメータとしてAPIキーを追加
    })
    
    // オプションパラメータは値がある場合のみ追加
    // アクティブステータスは必ず送信（デフォルトがactiveの場合も含む）
    if (status) {
      params.append('status', status)
    }
    
    if (sizeCategory && sizeCategory !== 'all' && sizeCategory !== '') {
      params.append('sizeCategory', sizeCategory)
    }
    
    // 更新日時パラメータの処理
    if (updatedAfter) {
      params.append('updatedAfter', updatedAfter)
    }
    
    if (updatedUntil) {
      params.append('updatedUntil', updatedUntil)
    }
    
    // 空白の更新日時を含むかどうか
    if (includeEmpty === 'true') {
      params.append('includeEmpty', 'true')
    }
    
    console.log('🔗 クエリパラメータ詳細:', {
      limit,
      offset,
      status: status || '(未指定)',
      statusSent: !!status,
      sizeCategory: sizeCategory || '(未指定)',
      updatedAfter: updatedAfter || '(未指定)',
      updatedUntil: updatedUntil || '(未指定)',
      includeEmpty: includeEmpty || '(未指定)',
      api_key: dominoApiKey ? dominoApiKey.substring(0, 8) + '...' : '未設定',
      fullParams: params.toString(),
      isActiveFilter: status === 'active'
    })
    
    const targetUrl = `${dominoApiUrl}/integrated?${params}`
    
    console.log('🔄 Domino APIプロキシ呼び出し:', {
      targetUrlMasked: targetUrl.replace(dominoApiKey, '***API_KEY***'),
      hasApiKey: !!dominoApiKey,
      apiKeyLength: dominoApiKey?.length,
      apiKeyPrefix: dominoApiKey?.substring(0, 8) + '...',
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
      let errorText = ''
      let errorData: any = null
      
      try {
        errorText = await response.text()
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
          } catch (parseError) {
            console.warn('⚠️ Domino APIレスポンスがJSONではありません')
          }
        }
      } catch (textError) {
        console.error('❌ Domino APIレスポンステキスト取得エラー:', textError)
        errorText = 'レスポンステキストを取得できませんでした'
      }
      
      console.error('❌ Domino APIエラー詳細:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorData,
        headers: Object.fromEntries(response.headers.entries()),
        url: targetUrl.replace(dominoApiKey, '***API_KEY***')
      })
      
      return NextResponse.json(
        { 
          error: `Domino API Error: ${response.status} ${response.statusText}`, 
          details: errorText,
          data: errorData 
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('📊 Domino APIデータ:', data)
    
    // 店舗データの詳細ログ
    if (data && data.data && Array.isArray(data.data)) {
      console.log('🏪 店舗データ詳細分析:')
      
      let totalCompanies = data.data.length
      let companiesWithStores = 0
      let totalStores = 0
      let activeStores = 0
      
      data.data.forEach((company: any, index: number) => {
        const hasStores = company.stores && company.stores.length > 0
        const storeCount = company.stores?.length || 0
        const activeStoreCount = company.stores?.filter((s: any) => s.status === 'active').length || 0
        
        if (hasStores) {
          companiesWithStores++
          totalStores += storeCount
          activeStores += activeStoreCount
        }
        
        console.log(`  企業${index + 1} "${company.name}": 店舗${storeCount}件 (アクティブ${activeStoreCount}件)`)
        
        // フィールド構造の詳細分析
        const allFields = Object.keys(company)
        const storeRelatedFields = allFields.filter(field => 
          field.toLowerCase().includes('store') ||
          field.toLowerCase().includes('shop') ||
          field.toLowerCase().includes('branch') ||
          field.toLowerCase().includes('location')
        )
        
        if (storeRelatedFields.length > 0) {
          console.log(`    店舗関連フィールド: ${storeRelatedFields.join(', ')}`)
        }
        
        if (hasStores) {
          company.stores.forEach((store: any, storeIndex: number) => {
            console.log(`    店舗${storeIndex + 1}: "${store.name}" (${store.status})`, {
              address: store.address,
              capacity: store.capacity,
              type: store.type,
              availableFields: Object.keys(store)
            })
          })
        } else {
          console.log(`    ❌ 店舗データなし - 全フィールド: ${allFields.join(', ')}`)
        }
      })
      
      console.log('📊 店舗データサマリー:', {
        totalCompanies,
        companiesWithStores,
        totalStores,
        activeStores,
        storePresenceRate: `${Math.round(companiesWithStores / totalCompanies * 100)}%`
      })
      
      if (companiesWithStores === 0) {
        console.log('⚠️ 重要: Domino APIレスポンスに店舗データが含まれていません')
        console.log('💡 可能性:')
        console.log('  1. Domino APIが店舗データを返さない設計')
        console.log('  2. 別のエンドポイントで店舗データを取得する必要がある')
        console.log('  3. 特定のパラメータが必要')
        console.log('  4. 権限不足で店舗データが除外されている')
      }
    }
    
    // CORSヘッダーを設定してレスポンス
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
      }
    })
    
  } catch (error) {
    console.error('❌ プロキシエラー詳細:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Proxy Error', 
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error
      },
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