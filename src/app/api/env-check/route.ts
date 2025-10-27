import { NextResponse } from 'next/server'

/**
 * 環境変数確認用エンドポイント
 */
export async function GET() {
  return NextResponse.json({
    server: {
      DOMINO_API_URL: process.env.DOMINO_API_URL,
      DOMINO_API_KEY: process.env.DOMINO_API_KEY ? process.env.DOMINO_API_KEY.substring(0, 8) + '...' : '未設定',
      NODE_ENV: process.env.NODE_ENV
    },
    client: {
      NEXT_PUBLIC_DOMINO_API_URL: process.env.NEXT_PUBLIC_DOMINO_API_URL,
      NEXT_PUBLIC_DOMINO_API_KEY: process.env.NEXT_PUBLIC_DOMINO_API_KEY ? process.env.NEXT_PUBLIC_DOMINO_API_KEY.substring(0, 8) + '...' : '未設定'
    }
  })
}