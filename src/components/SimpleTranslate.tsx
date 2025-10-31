"use client"

import { useEffect, useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    google: any
    googleTranslateElementInit: () => void
  }
}

const languages = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-CN', name: '中文(简体)' },
  { code: 'zh-TW', name: '中文(繁體)' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' }
]

interface SimpleTranslateProps {
  variant?: 'light' | 'dark'
}

const SimpleTranslate = ({ variant = 'light' }: SimpleTranslateProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('ja')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Google Translate初期化関数をグローバルに定義
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'ja',
            includedLanguages: languages.map(lang => lang.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          },
          'google_translate_element_hidden'
        )
        setIsLoaded(true)
      }
    }

    // Google Translate スクリプトを動的に読み込み
    const addScript = () => {
      if (document.querySelector('script[src*="translate.google.com"]')) {
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
  }, [])

  const translateTo = (langCode: string) => {
    if (!isLoaded) return

    if (langCode === 'ja') {
      // 日本語（元言語）に戻す
      const restoreButton = document.querySelector('a.goog-te-menu-value span') as HTMLElement
      if (restoreButton && restoreButton.textContent?.includes('元の言語')) {
        restoreButton.click()
      } else {
        // 別の方法で復元を試行
        window.location.reload()
      }
    } else {
      // 隠れたGoogle Translateセレクターを使用
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (selectElement) {
        selectElement.value = langCode
        selectElement.dispatchEvent(new Event('change'))
      } else {
        // セレクターが見つからない場合は、Google Translateのメニューを直接操作
        const translateElement = document.querySelector('#google_translate_element_hidden .goog-te-gadget-simple a') as HTMLElement
        if (translateElement) {
          translateElement.click()
          // 少し待ってから言語を選択
          setTimeout(() => {
            const languageOption = document.querySelector(`a[data-value="${langCode}"]`) as HTMLElement
            if (languageOption) {
              languageOption.click()
            }
          }, 100)
        }
      }
    }
    
    setCurrentLang(langCode)
    setIsOpen(false)
  }

  const getCurrentLanguageName = () => {
    return languages.find(lang => lang.code === currentLang)?.name || '日本語'
  }

  const getButtonClassName = () => {
    const baseClasses = "flex items-center gap-2"
    if (variant === 'dark') {
      return `${baseClasses} border-gray-600 !text-white !bg-gray-800/50 hover:!bg-gray-700 hover:border-gray-500 [&>span]:!text-white [&>svg]:!text-white`
    }
    return baseClasses
  }

  return (
    <div className="relative">
      {/* 非表示のGoogle Translate要素 */}
      <div id="google_translate_element_hidden" className="hidden" />
      
      {/* カスタム翻訳ボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClassName()}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{getCurrentLanguageName()}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {/* 言語選択ドロップダウン */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 border rounded-md shadow-lg z-50 ${
          variant === 'dark' 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1 max-h-64 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => translateTo(language.code)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  variant === 'dark'
                    ? `hover:bg-gray-700 ${
                        currentLang === language.code ? 'bg-blue-700 text-white' : 'text-white'
                      }`
                    : `hover:bg-gray-100 ${
                        currentLang === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default SimpleTranslate