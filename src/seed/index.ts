import path from 'path'
import { getPayload, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../payload.config'
import * as content from './content'

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

async function findOrCreateByName<T extends 'people' | 'partners'>(
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
  if (docs[0]) return docs[0].id
  const doc = await payload.create({
    collection,
    data: data as never,
    locale: 'ru',
    overrideAccess: true,
  })
  payload.logger.info(`seed: ${collection} «${data.name}» — создано`)
  return doc.id
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

  const speakerId = await findOrCreateByName(payload, 'people', content.speaker)
  const speakerDoc = await payload.findByID({
    collection: 'people',
    id: speakerId,
    depth: 0,
    overrideAccess: true,
  })
  if (!speakerDoc.photo) {
    const photoId = await ensureMedia(payload, content.speakerPhoto)
    await payload.update({
      collection: 'people',
      id: speakerId,
      data: { photo: photoId },
      overrideAccess: true,
    })
  }

  const partnerIds: number[] = []
  for (const partner of content.partners) {
    partnerIds.push(await findOrCreateByName(payload, 'partners', partner))
  }

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
