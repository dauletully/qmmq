import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker-образа (см. Dockerfile и docs/DEPLOY.md).
  output: 'standalone',
  // Отдельная папка сборки на процесс: несколько dev-серверов в одном репозитории не мешают друг другу.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Своя 404 для адресов вне маршрутов: у публичной части две корневые разметки (RU/KZ) и админка.
  experimental: {
    globalNotFound: true,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
