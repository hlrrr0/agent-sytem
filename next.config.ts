import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化設定
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // トレイル設定
  trailingSlash: false,
  
  // 出力設定 - Static Site Generationを無効化
  output: 'standalone',
  
  // Webpack設定でFirebase関連の問題を解決
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
