import { NextResponse } from 'next/server'

/**
 * 環境変数確認用エンドポイント
 */
export async function GET() {
  const serverDominoKey = process.env.DOMINO_API_KEY
  const clientDominoKey = process.env.NEXT_PUBLIC_DOMINO_API_KEY
  
  return NextResponse.json({
    server: {
      DOMINO_API_URL: process.env.DOMINO_API_URL,
      DOMINO_API_KEY: serverDominoKey ? serverDominoKey.substring(0, 8) + '...' : '未設定',
      DOMINO_API_KEY_LENGTH: serverDominoKey?.length || 0,
      DOMINO_API_KEY_FULL: serverDominoKey, // デバッグ用
      NODE_ENV: process.env.NODE_ENV,
      FORCE_PRODUCTION_API: process.env.FORCE_PRODUCTION_API
    },
    client: {
      NEXT_PUBLIC_DOMINO_API_URL: process.env.NEXT_PUBLIC_DOMINO_API_URL,
      NEXT_PUBLIC_DOMINO_API_KEY: clientDominoKey ? clientDominoKey.substring(0, 8) + '...' : '未設定',
      NEXT_PUBLIC_DOMINO_API_KEY_LENGTH: clientDominoKey?.length || 0,
      NEXT_PUBLIC_DOMINO_API_KEY_FULL: clientDominoKey // デバッグ用
    },
    validation: {
      serverKeyValid: serverDominoKey && serverDominoKey !== 'your-hr-api-secret-key',
      clientKeyValid: clientDominoKey && clientDominoKey !== 'your-hr-api-secret-key',
      keysMatch: serverDominoKey === clientDominoKey,
      urlsMatch: process.env.DOMINO_API_URL === process.env.NEXT_PUBLIC_DOMINO_API_URL
    },
    allDominoEnvs: Object.keys(process.env)
      .filter(key => key.includes('DOMINO'))
      .reduce((acc, key) => {
        acc[key] = process.env[key]
        return acc
      }, {} as Record<string, string | undefined>)
  })
}