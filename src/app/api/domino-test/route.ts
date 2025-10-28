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
      
      // 店舗データの詳細分析
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        console.log('🏪 店舗データ分析開始:')
        
        responseData.data.forEach((company: any, index: number) => {
          console.log(`\n📋 企業${index + 1}: "${company.name}"`)
          console.log(`  - ID: ${company.id}`)
          console.log(`  - ステータス: ${company.status}`)
          console.log(`  - 全フィールド:`, Object.keys(company))
          
          // 店舗関連フィールドの確認
          const storeFields = Object.keys(company).filter(key => 
            key.toLowerCase().includes('store') || 
            key.toLowerCase().includes('shop') || 
            key.toLowerCase().includes('location') ||
            key.toLowerCase().includes('branch')
          )
          
          if (storeFields.length > 0) {
            console.log(`  - 店舗関連フィールド:`, storeFields)
            storeFields.forEach(field => {
              console.log(`    ${field}:`, company[field])
            })
          }
          
          // stores フィールドの詳細確認
          if (company.stores) {
            console.log(`  ✅ stores フィールド存在:`, {
              type: typeof company.stores,
              isArray: Array.isArray(company.stores),
              length: Array.isArray(company.stores) ? company.stores.length : 'N/A',
              content: company.stores
            })
            
            if (Array.isArray(company.stores) && company.stores.length > 0) {
              company.stores.forEach((store: any, storeIndex: number) => {
                console.log(`    店舗${storeIndex + 1}:`, {
                  name: store.name || 'Name不明',
                  status: store.status || 'Status不明',
                  address: store.address || 'Address不明',
                  allFields: Object.keys(store)
                })
              })
            } else {
              console.log('    ⚠️ stores配列が空またはnull')
            }
          } else {
            console.log(`  ❌ stores フィールドが存在しません`)
            console.log(`  📋 利用可能な全フィールド:`, Object.keys(company))
          }
        })
      } else {
        console.log('❌ 企業データが見つかりません')
        console.log('📋 レスポンス構造:', responseData)
      }
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