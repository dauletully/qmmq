import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'

const webp = { format: 'webp' as const, options: { quality: 80 } }

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиа' },
  admin: {
    group: 'Контент',
    description:
      'Фотографии, логотипы и PDF (положение, образец сертификата). Для фото автоматически создаются уменьшенные копии в WebP.',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  fields: [
    {
      name: 'alt',
      label: 'Описание изображения (alt)',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Что изображено — коротко, одной фразой. Читают незрячие посетители и поисковики. Для PDF можно оставить пустым.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    adminThumbnail: 'thumb',
    focalPoint: true,
    // Оригинал сохраняется как есть (в т.ч. SVG-логотипы), копии — в WebP.
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: webp },
      { name: 'card', width: 800, formatOptions: webp },
      { name: 'hero', width: 1600, formatOptions: webp },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: webp },
    ],
  },
}
