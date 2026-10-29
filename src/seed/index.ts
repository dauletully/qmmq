import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../payload.config'
import * as content from './content'
import { seedSite } from './site-content'

// pnpm seed — создаёт мероприятие XII конкурса и лендинг contest-2026, загружает логотип и фото.
// Повторный запуск ничего не дублирует и не трогает правки команды.
// Перезаписать тексты из сида: SEED_FORCE=1 pnpm seed

const force = process.env.SEED_FORCE === '1' || process.argv.includes('force')
const assetsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'assets')

async function upsertBySlug<T extends 'events' | 'landings'>(
  payload: Payload,
  collection: T,
  slug: string,
  data: Record<string, unknown>,
): Promise<{ id: number; written: boolean }> {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs[0]) {
    if (force) {
      await payload.update({
        collection,
        id: docs[0].id,
        data: data as never,
        locale: 'ru',
        overrideAccess: true,
      })
      payload.logger.info(`seed: ${collection}/${slug} — обновлено`)
    } else {
      payload.logger.info(`seed: ${collection}/${slug} — уже есть, пропускаем`)
    }
    return { id: docs[0].id, written: force }
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    locale: 'ru',
    overrideAccess: true,
  })
  payload.logger.info(`seed: ${collection}/${slug} — создано`)
  return { id: doc.id, written: true }
}

async function findOrCreateByName<T extends 'people'>(
  payload: Payload,
  collection: T,
  data: { name: string } & Record<string, unknown>,
): Promise<number> {
  const { docs } = await payload.find({
    collection,
    where: { name: { equals: data.name } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs[0]) {
    if (force) {
      await payload.update({
        collection,
        id: docs[0].id,
        data: data as never,
        locale: 'ru',
        overrideAccess: true,
      })
    }
    return docs[0].id
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    locale: 'ru',
    overrideAccess: true,
  })
  payload.logger.info(`seed: ${collection} «${data.name}» — создано`)
  return doc.id
}

function mediaPath(payload: Payload, filename: string) {
  const upload = payload.collections.media.config.upload
  const dir = typeof upload === 'object' && upload.staticDir ? upload.staticDir : 'media'
  return path.resolve(process.cwd(), dir, filename)
}

// Запись в media есть, а файла на диске нет (например, папку media удалили) —
// загружаем файл из src/seed/assets заново под тем же именем.
async function restoreMediaFiles(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'media',
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  for (const doc of docs) {
    if (!doc.filename) continue
    // Если Payload уже переименовал файл при прошлом восстановлении (name-1.jpg) — возвращаем имя.
    const original = doc.filename.replace(/-\d+(\.[a-z0-9]+)$/i, '$1')
    const asset = [doc.filename, original].find((f) => fs.existsSync(path.join(assetsDir, f)))
    if (!asset) continue
    if (fs.existsSync(mediaPath(payload, doc.filename)) && doc.filename === asset) continue
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {},
      filePath: path.join(assetsDir, asset),
      overwriteExistingFiles: true,
      overrideAccess: true,
    })
    payload.logger.info(`seed: media ${asset} — файл восстановлен`)
  }
}

// Файл из src/seed/assets → media (повторно не загружается: ищем по имени файла).
async function ensureMedia(
  payload: Payload,
  asset: { file: string; alt: string; altKk?: string; focalX?: number; focalY?: number },
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: asset.file } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs[0]) return docs[0].id
  const doc = await payload.create({
    collection: 'media',
    data: {
      alt: asset.alt,
      ...(asset.focalX !== undefined ? { focalX: asset.focalX } : {}),
      ...(asset.focalY !== undefined ? { focalY: asset.focalY } : {}),
    },
    filePath: path.join(assetsDir, asset.file),
    locale: 'ru',
    overrideAccess: true,
  })
  if (asset.altKk) {
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { alt: asset.altKk },
      locale: 'kk',
      overrideAccess: true,
    })
  }
  payload.logger.info(`seed: media ${asset.file} — загружено`)
  return doc.id
}

async function ensurePerson(
  payload: Payload,
  data: { name: string } & Record<string, unknown>,
  photo: Parameters<typeof ensureMedia>[1],
): Promise<number> {
  const id = await findOrCreateByName(payload, 'people', data)
  const doc = await payload.findByID({ collection: 'people', id, depth: 0, overrideAccess: true })
  if (!doc.photo) {
    await payload.update({
      collection: 'people',
      id,
      data: { photo: await ensureMedia(payload, photo) },
      overrideAccess: true,
    })
  }
  return id
}

// Партнёр ищется по названию или прежнему названию. В существующей записи заполняются только пустые
// поля (и короткое прежнее название меняется на полное) — правки команды не трогаем.
async function ensurePartner(
  payload: Payload,
  partner: (typeof content.partners)[number],
): Promise<number> {
  const { nameKk, aliases = [], logo, ...data } = partner
  const { docs } = await payload.find({
    collection: 'partners',
    where: { name: { in: [data.name, ...aliases] } },
    limit: 1,
    depth: 0,
    locale: 'ru',
    overrideAccess: true,
  })
  const existing = docs[0]
  if (!existing) {
    const doc = await payload.create({
      collection: 'partners',
      data: { ...data, ...(logo ? { logo: await ensureMedia(payload, logo) } : {}) },
      locale: 'ru',
      overrideAccess: true,
    })
    await payload.update({
      collection: 'partners',
      id: doc.id,
      data: { name: nameKk },
      locale: 'kk',
      overrideAccess: true,
    })
    payload.logger.info(`seed: partners «${data.name}» — создано`)
    return doc.id
  }

  const patch: Record<string, unknown> = force ? { ...data } : {}
  if (aliases.includes(existing.name)) patch.name = data.name
  if (!existing.url) patch.url = data.url
  if (logo && (force || !existing.logo)) patch.logo = await ensureMedia(payload, logo)
  if (Object.keys(patch).length) {
    await payload.update({
      collection: 'partners',
      id: existing.id,
      data: patch,
      locale: 'ru',
      overrideAccess: true,
    })
    payload.logger.info(`seed: partners «${data.name}» — дополнено`)
  }
  const kk = await payload.findByID({
    collection: 'partners',
    id: existing.id,
    depth: 0,
    locale: 'kk',
    fallbackLocale: false,
    overrideAccess: true,
  })
  if (force || !kk.name) {
    await payload.update({
      collection: 'partners',
      id: existing.id,
      data: { name: nameKk },
      locale: 'kk',
      overrideAccess: true,
    })
  }
  return existing.id
}

// Абзацы → документ Lexical для полей richText.
function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}

// Казахские тексты в массивах: строки массива сопоставляются по id, иначе русские значения пропадут.
async function writeLandingKk(payload: Payload, landingId: number) {
  const ru = await payload.findByID({
    collection: 'landings',
    id: landingId,
    depth: 0,
    locale: 'ru',
    overrideAccess: true,
  })
  const kk = content.landingHeroKk
  await payload.update({
    collection: 'landings',
    id: landingId,
    locale: 'kk',
    overrideAccess: true,
    data: {
      hero: {
        eyebrow: kk.eyebrow,
        heading: kk.heading,
        subheading: kk.subheading,
        partnerNote: kk.partnerNote,
        primaryCta: kk.primaryCta,
        secondaryCta: kk.secondaryCta,
        stats: (ru.hero?.stats ?? []).map((row, i) => ({
          ...row,
          label: kk.statLabels[i] ?? row.label,
        })),
      },
      gallery: {
        images: (ru.gallery?.images ?? []).map((row, i) => ({
          ...row,
          caption: content.gallery[i]?.captionKk ?? row.caption,
        })),
      },
    },
  })
  payload.logger.info('seed: landings — казахский первый экран и подписи фото')
}

export async function seed(payload: Payload) {
  await restoreMediaFiles(payload)
  const eventResult = await upsertBySlug(payload, 'events', content.event.slug, content.event)
  if (eventResult.written) {
    await payload.update({
      collection: 'events',
      id: eventResult.id,
      data: content.eventKk,
      locale: 'kk',
      overrideAccess: true,
    })
  }

  const speakerId = await ensurePerson(payload, content.speaker, content.speakerPhoto)
  const speakerKk = await payload.findByID({
    collection: 'people',
    id: speakerId,
    depth: 0,
    locale: 'kk',
    fallbackLocale: false,
    overrideAccess: true,
  })
  if (force || !speakerKk.position || !speakerKk.quote) {
    await payload.update({
      collection: 'people',
      id: speakerId,
      data: content.speakerKk,
      locale: 'kk',
      overrideAccess: true,
    })
  }
  // Цитата добавлена позже сида: в существующей записи заполняем, только если пусто.
  const speakerRu = await payload.findByID({
    collection: 'people',
    id: speakerId,
    depth: 0,
    locale: 'ru',
    overrideAccess: true,
  })
  if (!speakerRu.quote && content.speaker.quote) {
    await payload.update({
      collection: 'people',
      id: speakerId,
      data: { quote: content.speaker.quote },
      locale: 'ru',
      overrideAccess: true,
    })
  }
  const authorId = await ensurePerson(payload, content.addressAuthor, content.addressAuthorPhoto)

  const partnerIds: number[] = []
  for (const partner of content.partners) partnerIds.push(await ensurePartner(payload, partner))

  const galleryIds: number[] = []
  for (const photo of content.gallery) galleryIds.push(await ensureMedia(payload, photo))

  const landingData = {
    ...content.landing,
    event: eventResult.id,
    gallery: {
      ...content.landing.gallery,
      images: content.gallery.map((photo, i) => ({ image: galleryIds[i], caption: photo.caption })),
    },
    speakers: { ...content.landing.speakers, people: [speakerId] },
    address: { ...content.landing.address, author: authorId, body: richText(content.addressBody) },
    partners: { ...content.landing.partners, items: partnerIds },
  }
  const landingResult = await upsertBySlug(payload, 'landings', content.landing.slug, landingData)
  if (landingResult.written) await writeLandingKk(payload, landingResult.id)

  // Настройки сайта: заполняем только пустое.
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    locale: 'ru',
    overrideAccess: true,
  })
  const patch: Record<string, unknown> = {}
  if (!settings.associationName) patch.associationName = content.siteSettings.associationName
  if (!settings.activeLanding) patch.activeLanding = landingResult.id
  if (!settings.logo) patch.logo = await ensureMedia(payload, content.logo)
  if (Object.keys(patch).length) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: patch,
      locale: 'ru',
      overrideAccess: true,
    })
    payload.logger.info('seed: site-settings — заполнены пустые поля')
  }
  const settingsKk = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    locale: 'kk',
    fallbackLocale: false,
    overrideAccess: true,
  })
  if (!settingsKk.associationName) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { associationName: content.siteSettings.associationNameKk },
      locale: 'kk',
      overrideAccess: true,
    })
  }

  // Сайт: страницы «Об ассоциации» и «Партнёрам», архив мероприятий, новости (src/seed/site-content.ts).
  await seedSite(payload, force)

  payload.logger.info('seed: готово')
}

const payload = await getPayload({ config })
try {
  await seed(payload)
  process.exit(0)
} catch (err) {
  payload.logger.error({ err, msg: 'seed: ошибка' })
  process.exit(1)
}
