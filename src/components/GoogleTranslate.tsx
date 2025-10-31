"use client"

import { useEffect } from 'react'
import { Globe } from 'lucide-react'

declare global {
  interface Window {
    google: any
    googleTranslateElementInit: () => void
  }
}

const GoogleTranslate = () => {
  useEffect(() => {
    // Google Translate初期化関数をグローバルに定義
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'ja', // デフォルト言語を日本語に設定
            includedLanguages: 'en,ko,zh-CN,zh-TW,th,vi,es,fr,de,it,pt,ru', // 対応言語を制限
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          },
          'google_translate_element'
        )
      }
    }

    // Google Translate スクリプトを動的に読み込み
    const addScript = () => {
      // 既にスクリプトが存在する場合は再読み込みしない
      if (document.querySelector('script[src*="translate.google.com"]')) {
        // 既存の要素を初期化
        if (window.google && window.google.translate) {
          window.googleTranslateElementInit()
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    addScript()

    // クリーンアップ関数
    return () => {
      // Google Translateの要素をクリア
      const translateElement = document.getElementById('google_translate_element')
      if (translateElement) {
        translateElement.innerHTML = ''
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <div 
        id="google_translate_element"
        className="google-translate-wrapper"
      />
    </div>
  )
}

export default GoogleTranslate