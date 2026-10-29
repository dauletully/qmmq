import { getPayload, type Payload } from 'payload'

import config from '../payload.config'
import * as content from './content'

// pnpm seed — создаёт мероприятие XII конкурса и лендинг contest-2026.
// Повторный запуск ничего не дублирует и не трогает правки команды.
// Перезаписать тексты из сида: SEED_FORCE=1 pnpm seed

const force = process.env.SEED_FORCE === '1' || process.argv.includes('force')

async function upsertBySlug<T extends 'events' | 'landings'>(
  payload: Payload,
  collection: T,
  slug: string,
  data: Record<string, unknown>,
): Promise<{ id: number; created: boolean }> {
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
    return { id: docs[0].id, created: false }
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    locale: 'ru',
    overrideAccess: true,
  })
  payload.logger.info(`seed: ${collection}/${slug} — создано`)
  return { id: doc.id, created: true }
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

export async function seed(payload: Payload) {
  const eventResult = await upsertBySlug(payload, 'events', content.event.slug, content.event)

  const speakerId = await findOrCreateByName(payload, 'people', content.speaker)
  const partnerIds: number[] = []
  for (const partner of content.partners) {
    partnerIds.push(await findOrCreateByName(payload, 'partners', partner))
  }

  const landingData = {
    ...content.landing,
    event: eventResult.id,
    speakers: { ...content.landing.speakers, people: [speakerId] },
    partners: { ...content.landing.partners, items: partnerIds },
  }
  const landingResult = await upsertBySlug(payload, 'landings', content.landing.slug, landingData)

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
  if (Object.keys(patch).length) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: patch,
      locale: 'ru',
      overrideAccess: true,
    })
    payload.logger.info('seed: site-settings — заполнены пустые поля')
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
