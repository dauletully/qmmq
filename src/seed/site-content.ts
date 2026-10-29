import type { Payload } from 'payload'

// Сид сайта qmmq.kz (первая очередь): страницы «Об ассоциации» и «Партнёрам», команда,
// архив мероприятий I–X конкурсов и олимпиад 2026 года, 2–3 новости по публикациям октября 2026.
// Только подтверждённые факты из docs/research/facts.md; неподтверждённое не заполняем.
// Казахские и английские тексты — черновики, нужна вычитка носителем.
// Идемпотентно: существующие записи не трогаем (кроме пустых полей), SEED_FORCE=1 — перезаписать.

type Loc = 'ru' | 'kk' | 'en'

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

const SRC = {
  makishev2013:
    'https://journals.azbuki.bg/mathinfo/pervii-tvorceskii-konkurs-ucitelei-matematiki-kazaxstana/pdf',
  kaktus2021:
    'https://kaktus.media/doc/450899_ychitel_iz_kyrgyzstana_oderjal_pobedy_na_mejdynarodnoy_olimpiade.html',
  abai2022: 'https://abaiuniversity.edu.kz/ru/25594/news/',
  insta2023: 'https://www.instagram.com/qmmq.kz/p/C0emomgNskK/',
  rfmsh2026: 'https://almaty.fizmat.kz/ru/news/32995/',
  liter2026:
    'https://liter.kz/dvum-uchiteliam-fiziki-i-matematiki-vruchili-kliuchi-ot-novykh-avtomobilei-v-natsionalnoi-akademii-nauk-rk-1793113374/',
  egemen2026:
    'https://egemen.kz/news/eki-mugalim-akademik-asqar-zhumadildaevtyn-olimpiadasynan-kolik-minip-qaytty',
  almatytv2026:
    'https://almaty.tv/kz/news/obschestvo/almatyda-fizika-men-matematika-p-ninin-mugalimderi-k-alalyk-olimpiadada-bak-synady',
}

// ---- Мероприятия: архив ------------------------------------------------------------------

type SeedEvent = {
  slug: string
  ru: Record<string, unknown> & { title: string }
  kk?: Record<string, unknown>
}

const archiveEvents: SeedEvent[] = [
  {
    slug: 'contest-2013',
    ru: {
      title: 'I творческий конкурс учителей математики Казахстана',
      type: 'contest',
      level: 'republic',
      format: 'offline',
      subjects: ['math'],
      contestSeason: 1,
      startDate: '2013-09-26T04:00:00.000Z',
      endDate: '2013-09-28T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      venue: 'РФМШ им. О. Жаутыкова',
      forWhom: 'Учителя математики — по три представителя от каждой области Казахстана',
      documentIssued: 'Дипломы победителям',
      description: richText([
        'Первый творческий конкурс учителей математики Казахстана прошёл 26–28 сентября 2013 года в Республиканской физико-математической школе в Алматы. Участвовали 69 учителей — по три от каждой области; конкурсанты решали 8 задач.',
        'Жюри возглавил академик А. С. Джумадильдаев; автором задач выступил А. Д. Блинков (МЦНМО, Москва), в жюри работал профессор Сава Гроздев (Институт математики Болгарии). Конкурс прошёл при поддержке Министерства образования; генеральный спонсор — АО «Интергаз Центральная Азия». Инициатор — К. Б. Макишев.',
        'Источник: К. Макишев, «Первый творческий конкурс учителей математики Казахстана», Математика и информатика (София), 2013.',
      ]),
      results: {
        summary:
          '69 учителей из всех областей Казахстана; жюри возглавил академик Аскар Джумадильдаев.',
      },
    },
    kk: { title: 'Қазақстан математика мұғалімдерінің I шығармашылық байқауы' },
  },
  {
    slug: 'contest-2019',
    ru: {
      title: 'VII Международный творческий конкурс учителей математики, физики и информатики',
      type: 'contest',
      level: 'international',
      format: 'offline',
      subjects: ['math', 'physics', 'informatics'],
      contestSeason: 7,
      startDate: '2019-12-01T04:00:00.000Z',
      endDate: '2019-12-02T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      description: richText([
        'VII Международный творческий конкурс для учителей математики, физики и информатики прошёл 1–2 декабря 2019 года в Алматы. По математике соревновались 108 участников.',
        'Источник: Kaktus.media, 09.12.2021 (со ссылкой на Министерство образования Кыргызстана).',
      ]),
      results: {
        summary: '108 участников по математике.',
        winners: [
          { place: '1', name: 'Мамат Ишматов', detail: 'Математика, Кыргызстан', prize: '' },
        ],
      },
    },
    kk: {
      title:
        'Математика, физика және информатика мұғалімдерінің VII Халықаралық шығармашылық байқауы',
    },
  },
  {
    slug: 'contest-2021',
    ru: {
      title: 'VIII Международный творческий конкурс учителей математики, физики и информатики',
      type: 'contest',
      level: 'international',
      format: 'offline',
      subjects: ['math', 'physics', 'informatics'],
      contestSeason: 8,
      startDate: '2021-12-04T04:00:00.000Z',
      endDate: '2021-12-05T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      description: richText([
        'VIII Международный творческий конкурс прошёл 4–5 декабря 2021 года в Алматы: более 220 учителей математики, 70 учителей физики и 50 учителей информатики.',
        'Источник: Kaktus.media, 09.12.2021.',
      ]),
      results: {
        summary: 'Более 220 учителей математики, 70 — физики, 50 — информатики.',
        winners: [
          { place: '1', name: 'Медер Осмонов', detail: 'Школа «Газпром Кыргызстан»', prize: '' },
        ],
      },
    },
    kk: {
      title:
        'Математика, физика және информатика мұғалімдерінің VIII Халықаралық шығармашылық байқауы',
    },
  },
  {
    slug: 'contest-2022',
    ru: {
      title: 'IX Международный творческий конкурс учителей математики, физики и информатики',
      type: 'contest',
      level: 'international',
      format: 'offline',
      subjects: ['math', 'physics', 'informatics'],
      contestSeason: 9,
      startDate: '2022-12-03T04:00:00.000Z',
      endDate: '2022-12-04T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      venue: 'КазНПУ им. Абая',
      documentIssued: 'Дипломы I–III степени победителям, сертификаты всем участникам',
      description: richText([
        'IX Международный творческий конкурс прошёл 3–4 декабря 2022 года в Казахском национальном педагогическом университете им. Абая совместно с Казахстанской ассоциацией учителей математики при поддержке Министерства науки и высшего образования РК.',
        'Участвовали более 400 учителей из всех регионов, проверено около 3 200 работ. В программе — шахматный турнир и турнир по тогызкумалаку, выставка «Образование», семинар И. Ибатулина (Москва). На пленарной сессии выступил академик А. С. Джумадильдаев.',
        'Источник: Abai University, 05.12.2022.',
      ]),
      results: {
        summary:
          'Более 400 учителей из всех регионов Казахстана, около 3 200 проверенных работ; при поддержке Министерства науки и высшего образования РК.',
      },
    },
    kk: {
      title:
        'Математика, физика және информатика мұғалімдерінің IX Халықаралық шығармашылық байқауы',
    },
  },
  {
    slug: 'contest-2023',
    ru: {
      title: 'X Международный творческий конкурс учителей математики, физики и информатики',
      type: 'contest',
      level: 'international',
      format: 'offline',
      subjects: ['math', 'physics', 'informatics'],
      contestSeason: 10,
      startDate: '2023-12-02T04:00:00.000Z',
      endDate: '2023-12-03T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      venue: 'Satbayev University и Международный университет информационных технологий',
      description: richText([
        'X Международный творческий конкурс учителей математики, физики и информатики прошёл 2–3 декабря 2023 года в Алматы на площадках Satbayev University (КазНИТУ им. К. Сатпаева) и Международного университета информационных технологий — при поддержке Министерства просвещения РК и НЦПК «Өрлеу».',
        'Источник: Instagram @qmmq.kz, 05.12.2023.',
      ]),
      results: {
        summary: 'При поддержке Министерства просвещения РК и НЦПК «Өрлеу».',
      },
    },
    kk: {
      title:
        'Математика, физика және информатика мұғалімдерінің X Халықаралық шығармашылық байқауы',
    },
  },
  {
    slug: 'olympiad-2026-spring',
    ru: {
      title:
        'Республиканская олимпиада молодых учителей математики к 70-летию академика А. С. Джумадильдаева',
      type: 'olympiad',
      level: 'republic',
      format: 'offline',
      subjects: ['math'],
      startDate: '2026-03-23T04:00:00.000Z',
      endDate: '2026-03-23T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      forWhom: 'Учителя математики до 30 лет',
      description: richText([
        'Республиканский творческий конкурс (олимпиада) молодых учителей математики, посвящённый 70-летию академика А. С. Джумадильдаева, прошёл 23 марта 2026 года в Алматы. Организаторы — центр «Алматы дарыны» Управления образования Алматы, сообщество учителей математики Казахстана (QMMQ) и Beta High School.',
        'Источник: РФМШ Алматы, 24.03.2026.',
      ]),
      results: {
        summary:
          'Организаторы: центр «Алматы дарыны», Казахстанская ассоциация учителей математики (QMMQ) и Beta High School.',
      },
    },
    kk: {
      title:
        'Академик А. С. Жұмаділдаевтың 70 жылдығына арналған жас математика мұғалімдерінің республикалық олимпиадасы',
    },
  },
  {
    slug: 'olympiad-2026-almaty',
    ru: {
      title:
        'Городская олимпиада молодых учителей физики и математики к 70-летию академика А. С. Джумадильдаева',
      type: 'olympiad',
      level: 'city',
      format: 'offline',
      subjects: ['math', 'physics'],
      startDate: '2026-10-02T04:00:00.000Z',
      endDate: '2026-10-04T13:00:00.000Z',
      price: 0,
      region: 'almaty',
      city: 'Алматы',
      forWhom:
        'Учителя физики и математики государственных школ Алматы не старше 36 лет с категорией не ниже «педагог-модератор» и стажем в организации не меньше года',
      description: richText([
        'Городская олимпиада среди молодых учителей физики и математики, посвящённая 70-летию академика А. С. Джумадильдаева, прошла 2–4 октября 2026 года в Алматы. Организаторы — Управление образования г. Алматы, городской методический центр и Казахстанская ассоциация учителей математики; генеральный спонсор — Beta High School.',
        'Награждение состоялось 27 октября 2026 года в Национальной академии наук РК при Президенте РК. Два обладателя Гран-при получили автомобили Changan.',
        'Источники: Liter.kz, Egemen Qazaqstan, Almaty.tv — 27–28.10.2026.',
      ]),
      results: {
        summary:
          '115 учителей из более чем 75 школ Алматы; 45 призёров: 2 Гран-при, 5 первых, 12 вторых и 26 третьих мест. Награждение — 27 октября 2026 года в Национальной академии наук РК.',
        winners: [
          {
            place: 'grand_prix',
            name: 'Еркегүл Шынарбек',
            detail: 'Математика, школа-гимназия № 208',
            prize: 'Автомобиль Changan',
          },
          {
            place: 'grand_prix',
            name: 'Айсана Советхан',
            detail: 'Физика, специализированный лицей № 126',
            prize: 'Автомобиль Changan',
          },
        ],
      },
    },
    kk: {
      title:
        'Академик А. С. Жұмаділдаевтың 70 жылдығына арналған физика және математика пәні мұғалімдерінің қалалық олимпиадасы',
      results: {
        summary:
          'Алматының 75-тен астам мектебінен 115 мұғалім; 45 жүлдегер: 2 Гран-при, 5 бірінші, 12 екінші және 26 үшінші орын. Марапаттау — 2026 жылғы 27 қазан, ҚР Ұлттық ғылым академиясы.',
        winners: [
          { detail: 'Математика, № 208 мектеп-гимназия', prize: 'Changan автокөлігі' },
          { detail: 'Физика, № 126 мамандандырылған лицей', prize: 'Changan автокөлігі' },
        ],
      },
    },
  },
]

// ---- Новости (пересказ публикаций октября 2026 своими словами, со ссылкой на источник) --------

type SeedNews = {
  slug: string
  eventSlug: string
  ru: Record<string, unknown> & { title: string }
  kk?: Record<string, unknown>
}

const news: SeedNews[] = [
  {
    slug: 'olimpiada-2026-nagrazhdenie',
    eventSlug: 'olympiad-2026-almaty',
    ru: {
      title:
        'Две учительницы из Алматы получили автомобили на олимпиаде к 70-летию академика Джумадильдаева',
      excerpt:
        '27 октября в Национальной академии наук РК наградили победителей городской олимпиады молодых учителей физики и математики. Обладательницы Гран-при получили ключи от автомобилей Changan.',
      body: richText([
        '27 октября 2026 года в Национальной академии наук РК при Президенте РК прошла церемония награждения городской олимпиады среди молодых учителей физики и математики, посвящённой 70-летию академика Аскара Джумадильдаева. В олимпиаде участвовали 115 учителей из более чем 75 школ Алматы.',
        'Гран-при получили учитель математики школы-гимназии № 208 Еркегүл Шынарбек и учитель физики специализированного лицея № 126 Айсана Советхан. Каждой вручили ключи от автомобиля Changan — призы предоставил генеральный спонсор олимпиады Beta High School.',
        'На церемонии выступили президент НАН РК Ақылбек Күрішбаев и академик Аскар Джумадильдаев. «Богатство казахов — не под землёй, а на земле. В умах детей», — сказал академик, обращаясь к учителям.',
        'Организаторы олимпиады — Управление образования г. Алматы, городской методический центр и Казахстанская ассоциация учителей математики.',
      ]),
      tags: ['олимпиада', 'итоги'],
      publishedAt: '2026-10-27T13:00:00.000Z',
      sourceName: 'Liter.kz, 27.10.2026',
      sourceUrl: SRC.liter2026,
      _status: 'published',
    },
    kk: {
      title:
        'Академик Жұмаділдаевтың 70 жылдығына арналған олимпиадада Алматының екі мұғалімі автокөлік иеленді',
      excerpt:
        '27 қазанда ҚР Ұлттық ғылым академиясында жас физика және математика мұғалімдерінің қалалық олимпиадасы жеңімпаздары марапатталды. Гран-при иегерлеріне Changan автокөліктерінің кілті табысталды.',
    },
  },
  {
    slug: 'olimpiada-2026-itogi',
    eventSlug: 'olympiad-2026-almaty',
    ru: {
      title: 'Итоги городской олимпиады молодых учителей: 45 призёров из 115 участников',
      excerpt:
        'Два Гран-при, пять первых, двенадцать вторых и двадцать шесть третьих мест — так распределились награды олимпиады молодых учителей физики и математики Алматы.',
      body: richText([
        'Городская олимпиада молодых учителей физики и математики, посвящённая 70-летию академика А. С. Джумадильдаева, собрала 115 участников из более чем 75 школ Алматы. Участвовать могли учителя государственных школ не старше 36 лет с категорией не ниже «педагог-модератор» и стажем в организации не меньше года.',
        'Призёрами стали 45 учителей: два обладателя Гран-при, пять учителей заняли первые места, двенадцать — вторые, двадцать шесть — третьи. Обладатели Гран-при получили автомобили Changan от генерального спонсора — Beta High School.',
        'По словам организаторов, это уже вторая олимпиада, которую ученики академика проводят к его юбилею: первая, республиканская, прошла весной 2026 года в Beta High School.',
      ]),
      tags: ['олимпиада', 'итоги'],
      publishedAt: '2026-10-28T09:00:00.000Z',
      sourceName: 'Egemen Qazaqstan, 28.10.2026',
      sourceUrl: SRC.egemen2026,
      _status: 'published',
    },
    kk: {
      title: 'Жас мұғалімдердің қалалық олимпиадасының қорытындысы: 115 қатысушыдан 45 жүлдегер',
      excerpt:
        'Екі Гран-при, бес бірінші, он екі екінші және жиырма алты үшінші орын — Алматыдағы физика және математика мұғалімдері олимпиадасының марапаттары осылай бөлінді.',
    },
  },
  {
    slug: 'olimpiady-dlya-uchitelei-kazhdyi-god',
    eventSlug: 'olympiad-2026-almaty',
    ru: {
      title:
        'Победительница олимпиады: ассоциация каждый год проводит олимпиады для учителей математики, физики и информатики',
      excerpt:
        'Обладательница Гран-при Еркегүл Шынарбек рассказала, что три года назад уже получала диплом I степени на олимпиаде ассоциации — теперь к ней прибавился автомобиль.',
      body: richText([
        'В сюжете телеканала «Алматы» о награждении победителей городской олимпиады молодых учителей обладательница Гран-при по математике Еркегүл Шынарбек (школа-гимназия № 208) отметила, что Казахстанская ассоциация учителей математики каждый год проводит олимпиады для учителей математики, информатики и физики. Три года назад она уже участвовала в такой олимпиаде и получила диплом I степени.',
        'Олимпиада 2026 года прошла в октябре; награждение состоялось 27 октября в Национальной академии наук РК. На церемонии выступили президент НАН РК Ақылбек Күрішбаев и академик Аскар Джумадильдаев, к 70-летию которого была посвящена олимпиада.',
        'Следующие мероприятия ассоциации — в разделе «Мероприятия».',
      ]),
      tags: ['сообщество', 'олимпиада'],
      publishedAt: '2026-10-27T16:00:00.000Z',
      sourceName: 'Almaty.tv, 27.10.2026',
      sourceUrl: SRC.almatytv2026,
      _status: 'published',
    },
    kk: {
      title:
        'Олимпиада жеңімпазы: қауымдастық математика, физика және информатика мұғалімдеріне жыл сайын олимпиада өткізеді',
      excerpt:
        'Гран-при иегері Еркегүл Шынарбек үш жыл бұрын қауымдастық олимпиадасында бірінші дәрежелі диплом алғанын айтты — енді оған автокөлік қосылды.',
    },
  },
]

// ---- Партнёры для страницы «Партнёрам» -------------------------------------------------------

type SeedPartner = {
  name: string
  nameKk?: string
  nameEn?: string
  kind: 'ministry' | 'organizer' | 'partner' | 'university' | 'sponsor' | 'media'
  url?: string
  years: string
  description: string
  descriptionKk?: string
  descriptionEn?: string
  order: number
}

const partners: SeedPartner[] = [
  {
    name: 'Beta High School',
    kind: 'sponsor',
    years: '2026',
    description: 'Генеральный спонсор олимпиад 2026 года, автомобили Changan победителям',
    descriptionKk: '2026 жылғы олимпиадалардың бас демеушісі, жеңімпаздарға Changan автокөліктері',
    descriptionEn: 'General sponsor of the 2026 olympiads, Changan cars for the winners',
    order: 10,
  },
  {
    name: 'АО «Интергаз Центральная Азия»',
    nameKk: '«Интергаз Орталық Азия» АҚ',
    nameEn: 'Intergas Central Asia JSC',
    kind: 'sponsor',
    years: '2013',
    description: 'Генеральный спонсор I конкурса',
    descriptionKk: 'I байқаудың бас демеушісі',
    descriptionEn: 'General sponsor of the 1st contest',
    order: 11,
  },
  {
    name: 'Казахский национальный педагогический университет им. Абая',
    nameKk: 'Абай атындағы Қазақ ұлттық педагогикалық университеті',
    nameEn: 'Abai Kazakh National Pedagogical University',
    kind: 'university',
    url: 'https://abaiuniversity.edu.kz',
    years: '2022',
    description: 'Площадка IX конкурса',
    descriptionKk: 'IX байқаудың алаңы',
    descriptionEn: 'Venue of the 9th contest',
    order: 20,
  },
  {
    name: 'Satbayev University',
    kind: 'university',
    url: 'https://satbayev.university',
    years: '2023',
    description: 'Площадка X конкурса',
    descriptionKk: 'X байқаудың алаңы',
    descriptionEn: 'Venue of the 10th contest',
    order: 21,
  },
  {
    name: 'Международный университет информационных технологий',
    nameKk: 'Халықаралық ақпараттық технологиялар университеті',
    nameEn: 'International Information Technology University',
    kind: 'university',
    url: 'https://iitu.edu.kz',
    years: '2023',
    description: 'Площадка X конкурса',
    descriptionKk: 'X байқаудың алаңы',
    descriptionEn: 'Venue of the 10th contest',
    order: 22,
  },
  {
    name: 'Национальная академия наук РК при Президенте РК',
    nameKk: 'ҚР Президенті жанындағы Ұлттық ғылым академиясы',
    nameEn: 'National Academy of Sciences of Kazakhstan',
    kind: 'partner',
    years: '2026',
    description: 'Церемония награждения олимпиады 2026 года',
    descriptionKk: '2026 жылғы олимпиаданың марапаттау рәсімі',
    descriptionEn: 'Hosted the 2026 olympiad award ceremony',
    order: 30,
  },
  {
    name: 'Управление образования города Алматы',
    nameKk: 'Алматы қаласының Білім басқармасы',
    nameEn: 'Almaty City Education Department',
    kind: 'organizer',
    url: 'https://www.gov.kz/memleket/entities/almaty-edu',
    years: '2026',
    description: 'Соорганизатор олимпиад 2026 года',
    descriptionKk: '2026 жылғы олимпиадалардың бірлескен ұйымдастырушысы',
    descriptionEn: 'Co-organizer of the 2026 olympiads',
    order: 31,
  },
  {
    name: 'Национальный центр повышения квалификации «Өрлеу»',
    nameKk: '«Өрлеу» біліктілікті арттыру ұлттық орталығы',
    nameEn: 'Orleu National Center for Professional Development',
    kind: 'partner',
    years: '2023',
    description: 'Поддержка X конкурса',
    descriptionKk: 'X байқауды қолдау',
    descriptionEn: 'Supported the 10th contest',
    order: 32,
  },
]

// Партнёры из сида лендинга — отметить для страницы «Партнёрам», если поля пустые.
const landingPartnersPatch: Array<{ name: string; years: string; description: string }> = [
  {
    name: 'Республиканская физико-математическая школа',
    years: '2013',
    description: 'Площадка I конкурса',
  },
  { name: 'Министерство просвещения Республики Казахстан', years: '2023', description: 'Поддержка X конкурса' },
]

// ---- Глобалы ---------------------------------------------------------------------------------

const about: Record<Loc, Record<string, unknown>> = {
  ru: {
    heading: 'Казахстанская ассоциация учителей математики',
    lead: 'Республиканское общественное объединение, созданное в 2012 году по решению Первого съезда учителей математики Казахстана. С 2013 года проводим творческие конкурсы для учителей математики, физики и информатики, олимпиады и семинары.',
    mission: richText([
      'Ассоциация объединяет учителей математики, физики и информатики Казахстана. Решение о её создании принял Первый съезд учителей математики Казахстана 10–12 мая 2011 года; объединение зарегистрировано в июле 2012 года в Алматы (БИН 120740017281).',
      'С 2013 года ассоциация проводит творческий конкурс учителей: первый, республиканский, прошёл в РФМШ им. О. Жаутыкова, с 2019 года конкурсы собирали учителей математики, физики и информатики из Казахстана и соседних стран. IX конкурс (2022) прошёл в КазНПУ им. Абая при поддержке Министерства науки и высшего образования РК, X (2023) — на площадках Satbayev University и МУИТ при поддержке Министерства просвещения РК.',
      'В 2026 году ассоциация вместе с Управлением образования Алматы и Beta High School провела две олимпиады молодых учителей к 70-летию академика Аскара Джумадильдаева — председателя жюри первого конкурса 2013 года.',
    ]),
    figures: [
      { value: '2012', label: 'год основания' },
      { value: 'X', label: 'конкурсов учителей с 2013 по 2023 год' },
      { value: '400+', label: 'учителей на IX конкурсе 2022 года' },
    ],
    historyHeading: 'История',
    historyLead:
      'Ключевые события ассоциации — только то, что подтверждено публикациями и официальными источниками.',
    teamHeading: 'Команда',
    teamLead: 'Руководство ассоциации.',
    documentsHeading: 'Документы',
    documentsLead: 'Устав, свидетельство о регистрации и реквизиты ассоциации.',
    seoTitle: 'Об ассоциации — Казахстанская ассоциация учителей математики',
    seoDescription:
      'Казахстанская ассоциация учителей математики: с 2012 года проводим конкурсы и олимпиады для учителей математики, физики и информатики.',
  },
  kk: {
    heading: 'Қазақстан математика мұғалімдері қауымдастығы',
    lead: 'Қазақстан математика мұғалімдерінің I съезінің шешімімен 2012 жылы құрылған республикалық қоғамдық бірлестік. 2013 жылдан бері математика, физика және информатика мұғалімдеріне шығармашылық байқаулар, олимпиадалар мен семинарлар өткізіп келеміз.',
    historyHeading: 'Тарих',
    teamHeading: 'Команда',
    documentsHeading: 'Құжаттар',
    seoTitle: 'Қауымдастық туралы — Қазақстан математика мұғалімдері қауымдастығы',
  },
  en: {
    heading: 'Kazakhstan Association of Mathematics Teachers',
    lead: 'A republican public association founded in 2012 by decision of the First Congress of Mathematics Teachers of Kazakhstan. Since 2013 we have run creative contests, olympiads and seminars for teachers of mathematics, physics and computer science.',
    mission: richText([
      'The Association brings together teachers of mathematics, physics and computer science across Kazakhstan. It was founded by decision of the First Congress of Mathematics Teachers of Kazakhstan (10–12 May 2011) and registered in Almaty in July 2012.',
      'Since 2013 the Association has held an annual creative contest for teachers. The first, national contest took place at the Republican Physics and Mathematics School in Almaty; from 2019 the contests brought together teachers of mathematics, physics and computer science from Kazakhstan and neighbouring countries. The 9th contest (2022) was hosted by Abai University with the support of the Ministry of Science and Higher Education; the 10th (2023) took place at Satbayev University and IITU with the support of the Ministry of Education.',
      'In 2026 the Association, together with the Almaty City Education Department and Beta High School, held two olympiads for young teachers dedicated to the 70th birthday of academician Askar Dzhumadildaev, who chaired the jury of the first contest in 2013.',
    ]),
    figures: [
      { value: '2012', label: 'founded' },
      { value: 'X', label: 'teacher contests from 2013 to 2023' },
      { value: '400+', label: 'teachers at the 9th contest in 2022' },
    ],
    historyHeading: 'History',
    historyLead: 'Key milestones confirmed by publications and official sources.',
    teamHeading: 'Team',
    teamLead: 'Leadership of the Association.',
    documentsHeading: 'Documents',
    documentsLead: 'Charter, registration certificate and bank details.',
    seoTitle: 'About — Kazakhstan Association of Mathematics Teachers',
    seoDescription:
      'Kazakhstan Association of Mathematics Teachers: contests and olympiads for teachers of mathematics, physics and computer science since 2012.',
  },
}

type TimelineSeed = {
  year: number
  eventSlug?: string
  ru: { period: string; title: string; text: string }
  kk?: { period?: string; title: string; text?: string }
  en?: { period?: string; title: string; text?: string }
}

const timeline: TimelineSeed[] = [
  {
    year: 2011,
    ru: {
      period: 'Май 2011',
      title: 'Первый съезд учителей математики Казахстана',
      text: 'Съезд 10–12 мая принял решение создать ассоциацию.',
    },
    kk: { period: '2011, мамыр', title: 'Қазақстан математика мұғалімдерінің I съезі' },
    en: {
      period: 'May 2011',
      title: 'First Congress of Mathematics Teachers of Kazakhstan',
      text: 'The congress on 10–12 May resolved to found the Association.',
    },
  },
  {
    year: 2012,
    ru: {
      period: 'Июль 2012',
      title: 'Регистрация ассоциации',
      text: 'РОО «Казахстанская ассоциация учителей математики» зарегистрировано в Алматы.',
    },
    kk: { period: '2012, шілде', title: 'Қауымдастықтың тіркелуі' },
    en: {
      period: 'July 2012',
      title: 'Registration of the Association',
      text: 'The Kazakhstan Association of Mathematics Teachers is registered in Almaty.',
    },
  },
  {
    year: 2013,
    eventSlug: 'contest-2013',
    ru: {
      period: 'Сентябрь 2013',
      title: 'Первый творческий конкурс учителей математики',
      text: '69 учителей из всех областей; жюри возглавил академик Аскар Джумадильдаев.',
    },
    kk: { period: '2013, қыркүйек', title: 'Математика мұғалімдерінің I шығармашылық байқауы' },
    en: {
      period: 'September 2013',
      title: 'First creative contest for mathematics teachers',
      text: '69 teachers from every region; the jury was chaired by academician Askar Dzhumadildaev.',
    },
  },
  {
    year: 2019,
    eventSlug: 'contest-2019',
    ru: {
      period: 'Декабрь 2019',
      title: 'VII Международный творческий конкурс',
      text: 'Учителя математики, физики и информатики; 108 участников по математике.',
    },
    kk: { period: '2019, желтоқсан', title: 'VII Халықаралық шығармашылық байқау' },
    en: { period: 'December 2019', title: '7th International creative contest' },
  },
  {
    year: 2021,
    eventSlug: 'contest-2021',
    ru: {
      period: 'Декабрь 2021',
      title: 'VIII Международный творческий конкурс',
      text: 'Более 220 учителей математики, 70 — физики, 50 — информатики.',
    },
    kk: { period: '2021, желтоқсан', title: 'VIII Халықаралық шығармашылық байқау' },
    en: { period: 'December 2021', title: '8th International creative contest' },
  },
  {
    year: 2022,
    eventSlug: 'contest-2022',
    ru: {
      period: 'Декабрь 2022',
      title: 'IX Международный творческий конкурс',
      text: 'КазНПУ им. Абая; более 400 учителей из всех регионов, около 3 200 проверенных работ.',
    },
    kk: { period: '2022, желтоқсан', title: 'IX Халықаралық шығармашылық байқау' },
    en: {
      period: 'December 2022',
      title: '9th International creative contest',
      text: 'Abai University; over 400 teachers from every region.',
    },
  },
  {
    year: 2023,
    eventSlug: 'contest-2023',
    ru: {
      period: 'Декабрь 2023',
      title: 'X Международный творческий конкурс',
      text: 'Satbayev University и МУИТ; при поддержке Министерства просвещения РК и центра «Өрлеу».',
    },
    kk: { period: '2023, желтоқсан', title: 'X Халықаралық шығармашылық байқау' },
    en: { period: 'December 2023', title: '10th International creative contest' },
  },
  {
    year: 2026,
    eventSlug: 'olympiad-2026-spring',
    ru: {
      period: 'Март 2026',
      title: 'Республиканская олимпиада молодых учителей математики к 70-летию академика',
      text: 'Алматы, 23 марта; до 30 лет; «Алматы дарыны», QMMQ и Beta High School.',
    },
    kk: {
      period: '2026, наурыз',
      title: 'Академиктің 70 жылдығына арналған жас математика мұғалімдерінің республикалық олимпиадасы',
    },
    en: {
      period: 'March 2026',
      title: 'National olympiad for young mathematics teachers for the academician’s 70th birthday',
    },
  },
  {
    year: 2026,
    eventSlug: 'olympiad-2026-almaty',
    ru: {
      period: 'Октябрь 2026',
      title: 'Олимпиада молодых учителей физики и математики к 70-летию академика',
      text: '115 учителей из более чем 75 школ Алматы; 45 призёров, два Гран-при — автомобили Changan.',
    },
    kk: {
      period: '2026, қазан',
      title: 'Академиктің 70 жылдығына арналған жас физика және математика мұғалімдерінің олимпиадасы',
      text: 'Алматының 75-тен астам мектебінен 115 мұғалім; 45 жүлдегер, екі Гран-при — Changan автокөліктері.',
    },
    en: {
      period: 'October 2026',
      title: 'Olympiad for young physics and mathematics teachers for the academician’s 70th birthday',
      text: '115 teachers from over 75 Almaty schools; 45 prize-winners, two Grand Prix — Changan cars.',
    },
  },
]

const partnersPage: Record<Loc, Record<string, unknown>> = {
  ru: {
    heading: 'Партнёрам',
    lead: 'Конкурсы и олимпиады ассоциации собирают сотни учителей математики, физики и информатики со всей страны. Поддержка партнёров — это призы победителям, площадки и учебные материалы, а для партнёра — прямой контакт с учителями и школами Казахстана.',
    formats: [
      {
        icon: 'Trophy',
        title: 'Генеральный спонсор',
        text: 'Главные призы победителям и статус генерального спонсора конкурса: логотип на всех материалах, выступление на церемонии награждения.',
      },
      {
        icon: 'Award',
        title: 'Призы участникам',
        text: 'Призы и подарки призёрам или отдельной номинации — с упоминанием партнёра при награждении.',
      },
      {
        icon: 'Building',
        title: 'Площадка',
        text: 'Аудитории и залы для туров, разборов задач и лекций — так проходили конкурсы в КазНПУ им. Абая, Satbayev University и МУИТ.',
      },
      {
        icon: 'Mic',
        title: 'Информационный партнёр',
        text: 'Анонсы и итоги конкурса в ваших каналах, аккредитация на церемонию награждения.',
      },
    ],
    pastPartnersHeading: 'Нас поддерживали',
    contactHeading: 'Обсудить партнёрство',
    contactNote:
      'Оставьте контакты — мы ответим в течение двух рабочих дней и пришлём пакет спонсора ближайшего конкурса.',
    seo: {
      title: 'Партнёрам — Казахстанская ассоциация учителей математики',
      description:
        'Форматы сотрудничества с Казахстанской ассоциацией учителей математики: спонсорство конкурсов, призы, площадки, информационное партнёрство.',
    },
  },
  kk: {
    heading: 'Серіктестерге',
    lead: 'Қауымдастықтың байқаулары мен олимпиадалары еліміздің түкпір-түкпірінен жүздеген математика, физика және информатика мұғалімдерін жинайды. Серіктестердің қолдауы — жеңімпаздарға сыйлықтар, алаңдар мен оқу материалдары, ал серіктес үшін — Қазақстан мұғалімдері мен мектептерімен тікелей байланыс.',
    pastPartnersHeading: 'Бізді қолдағандар',
    contactHeading: 'Серіктестікті талқылау',
    seo: { title: 'Серіктестерге — Қазақстан математика мұғалімдері қауымдастығы' },
  },
  en: {
    heading: 'For partners',
    lead: 'The Association’s contests and olympiads bring together hundreds of teachers of mathematics, physics and computer science from across Kazakhstan. Partner support means prizes for the winners, venues and learning materials — and, for the partner, direct contact with the country’s teachers and schools.',
    formats: [
      {
        icon: 'Trophy',
        title: 'General sponsor',
        text: 'Main prizes for the winners and general-sponsor status: your logo on all materials and a speech at the award ceremony.',
      },
      {
        icon: 'Award',
        title: 'Prizes for participants',
        text: 'Prizes and gifts for prize-winners or a dedicated award, credited to the partner at the ceremony.',
      },
      {
        icon: 'Building',
        title: 'Venue',
        text: 'Lecture halls and classrooms for the rounds, problem reviews and lectures — as hosted by Abai University, Satbayev University and IITU.',
      },
      {
        icon: 'Mic',
        title: 'Media partner',
        text: 'Announcements and results in your channels, accreditation for the award ceremony.',
      },
    ],
    pastPartnersHeading: 'Our supporters',
    contactHeading: 'Discuss a partnership',
    contactNote:
      'Leave your contact details — we will reply within two working days and send the sponsor pack for the next contest.',
    seo: {
      title: 'For partners — Kazakhstan Association of Mathematics Teachers',
      description:
        'Ways to partner with the Kazakhstan Association of Mathematics Teachers: contest sponsorship, prizes, venues, media partnership.',
    },
  },
}

const homePage: Record<'ru' | 'kk', Record<string, unknown>> = {
  ru: {
    hero: {
      heading: 'Казахстанская ассоциация учителей математики',
      lead: 'Конкурсы, олимпиады и сообщество для учителей математики, физики и информатики — с 2012 года.',
      primaryCta: 'Ближайшие мероприятия',
      secondaryCta: 'Вступить в сообщество',
    },
    about: {
      heading: 'Об ассоциации',
      text: 'Республиканское общественное объединение учителей математики. С 2013 года проводим творческие конкурсы учителей, в 2026 году — олимпиады молодых учителей к 70-летию академика Аскара Джумадильдаева.',
    },
    community: {
      heading: 'Сообщество',
      text: 'Учителя математики, физики и информатики со всего Казахстана: обмен задачами и опытом, встречи на конкурсах, каталог педагогов-мастеров.',
    },
    seo: {
      title: 'Казахстанская ассоциация учителей математики',
      description:
        'Конкурсы, олимпиады и сообщество учителей математики, физики и информатики Казахстана.',
    },
  },
  kk: {
    hero: {
      heading: 'Қазақстан математика мұғалімдері қауымдастығы',
      lead: 'Математика, физика және информатика мұғалімдеріне арналған байқаулар, олимпиадалар және қауымдастық — 2012 жылдан бері.',
      primaryCta: 'Жақын іс-шаралар',
      secondaryCta: 'Қауымдастыққа қосылу',
    },
    about: { heading: 'Қауымдастық туралы' },
    community: { heading: 'Қауымдастық' },
    seo: { title: 'Қазақстан математика мұғалімдері қауымдастығы' },
  },
}

// ---- Люди ------------------------------------------------------------------------------------

const team = [
  {
    name: 'Кайрош Макишев',
    create: {
      roles: ['team'],
      // Регалии — по странице ветерана на сайте РФМШ и статье 2013 года (facts.md, п. 3.1).
      position: 'Кандидат физико-математических наук, директор РФМШ в 2003–2015 годах',
      contribution: 'Инициатор первого творческого конкурса учителей математики (2013)',
      // Руководитель организации — публичное лицо; согласие подтвердить у заказчика.
      publishConsent: true,
      order: 1,
    },
    teamPosition: { ru: 'Президент ассоциации', kk: 'Қауымдастық президенті', en: 'President' },
    positionKk: 'Физика-математика ғылымдарының кандидаты, 2003–2015 жылдарда РФМШ директоры',
    order: 1,
  },
  {
    // Создан сидом лендинга (автор обращения). Здесь — только должность в команде.
    name: 'Бахнур Зиябеков',
    create: { roles: ['team'], publishConsent: true, order: 2 },
    teamPosition: {
      ru: 'Вице-президент ассоциации',
      kk: 'Қауымдастық вице-президенті',
      en: 'Vice President',
    },
    order: 2,
  },
]

// Академик — спикер и жюри лендинга; для сайта добавляем биографию и цитату (facts.md, п. 1).
const academician = {
  name: 'Аскар Джумадильдаев',
  bio: {
    ru: 'Родился 25 февраля 1956 года в Кызылординской области. Академик Национальной академии наук РК, доктор физико-математических наук, профессор; с 2023 года — вице-президент НАН РК при Президенте РК. Қазақстанның Еңбек Ері (2024), лауреат Государственной премии РК (2011) и Международной премии аль-Хорезми (2012), член Всемирной академии наук (TWAS). Исследования — алгебры Ли, неассоциативные алгебры и комбинаторика; доказал гипотезу Селигмана. Председатель жюри Первого творческого конкурса учителей математики (2013); олимпиады 2026 года посвящены его 70-летию.',
    kk: '1956 жылғы 25 ақпанда Қызылорда облысында туған. ҚР Ұлттық ғылым академиясының академигі, физика-математика ғылымдарының докторы, профессор; 2023 жылдан — ҚР Президенті жанындағы ҰҒА вице-президенті. Қазақстанның Еңбек Ері (2024), ҚР Мемлекеттік сыйлығының (2011) және әл-Хорезми халықаралық сыйлығының (2012) лауреаты. Математика мұғалімдерінің I шығармашылық байқауы қазылар алқасының төрағасы (2013); 2026 жылғы олимпиадалар оның 70 жылдығына арналды.',
  },
  quote: {
    ru: 'Богатство казахов — не под землёй, а на земле. В умах детей.',
    kk: 'Қазақтың байлығы жердің астында емес, жердің үстінде. Балалардың басында.',
  },
}

// ---- Запуск ----------------------------------------------------------------------------------

type Collection = 'events' | 'news' | 'partners' | 'people'

export async function seedSite(payload: Payload, force = false) {
  const log = (msg: string) => payload.logger.info(`seed(site): ${msg}`)

  async function findBy(collection: Collection, field: string, value: string) {
    const { docs } = await payload.find({
      collection,
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      ...(collection === 'news' ? { draft: true } : {}),
    })
    return docs[0] as { id: number } | undefined
  }

  async function writeLocale(
    collection: Collection,
    id: number,
    locale: Loc,
    data: Record<string, unknown>,
  ) {
    await payload.update({
      collection,
      id,
      data: data as never,
      locale,
      overrideAccess: true,
      ...(collection === 'news' ? { draft: false } : {}),
    })
  }

  // Мероприятия архива
  const eventIds = new Map<string, number>()
  for (const item of archiveEvents) {
    const existing = await findBy('events', 'slug', item.slug)
    if (existing && !force) {
      eventIds.set(item.slug, existing.id)
      continue
    }
    const data = { ...item.ru, slug: item.slug, statusOverride: 'auto' }
    const id = existing
      ? (await writeLocale('events', existing.id, 'ru', data), existing.id)
      : (
          await payload.create({
            collection: 'events',
            data: data as never,
            locale: 'ru',
            overrideAccess: true,
          })
        ).id
    eventIds.set(item.slug, id)
    if (item.kk) {
      // Строки массивов (победители) сопоставляются по id: читаем русскую версию и переносим id.
      const ru = await payload.findByID({
        collection: 'events',
        id,
        depth: 0,
        locale: 'ru',
        overrideAccess: true,
      })
      const kkResults = item.kk.results as
        | { summary?: string; winners?: Array<Record<string, unknown>> }
        | undefined
      const kk: Record<string, unknown> = { ...item.kk }
      if (kkResults) {
        kk.results = {
          ...(ru.results ?? {}),
          summary: kkResults.summary,
          winners: (ru.results?.winners ?? []).map((row, i) => ({
            ...row,
            ...(kkResults.winners?.[i] ?? {}),
          })),
        }
      }
      await writeLocale('events', id, 'kk', kk)
    }
    log(`events/${item.slug} — ${existing ? 'обновлено' : 'создано'}`)
  }

  // Номер сезона у текущего конкурса (создаёт сид лендинга)
  const current = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'contest-2026' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (current.docs[0] && current.docs[0].contestSeason == null) {
    await payload.update({
      collection: 'events',
      id: current.docs[0].id,
      data: { contestSeason: 12 },
      overrideAccess: true,
    })
    log('events/contest-2026 — номер сезона 12')
  }

  // Новости
  for (const item of news) {
    const existing = await findBy('news', 'slug', item.slug)
    if (existing && !force) continue
    const data = { ...item.ru, slug: item.slug, relatedEvent: eventIds.get(item.eventSlug) ?? null }
    const id = existing
      ? (await writeLocale('news', existing.id, 'ru', data), existing.id)
      : (
          await payload.create({
            collection: 'news',
            data: data as never,
            locale: 'ru',
            draft: false,
            overrideAccess: true,
          })
        ).id
    if (item.kk) await writeLocale('news', id, 'kk', { ...item.kk, _status: 'published' })
    log(`news/${item.slug} — ${existing ? 'обновлено' : 'создано'}`)
  }

  // Партнёры для страницы «Партнёрам»
  for (const p of partners) {
    const existing = await findBy('partners', 'name', p.name)
    if (existing && !force) continue
    const ru = {
      name: p.name,
      kind: p.kind,
      url: p.url,
      order: p.order,
      years: p.years,
      description: p.description,
      showOnPartnersPage: true,
    }
    const id = existing
      ? (await writeLocale('partners', existing.id, 'ru', ru), existing.id)
      : (
          await payload.create({
            collection: 'partners',
            data: ru as never,
            locale: 'ru',
            overrideAccess: true,
          })
        ).id
    // name — обязательное локализованное поле: без kk/en-варианта пишем русское название.
    await writeLocale('partners', id, 'kk', {
      name: p.nameKk ?? p.name,
      description: p.descriptionKk ?? p.description,
    })
    await writeLocale('partners', id, 'en', {
      name: p.nameEn ?? p.name,
      description: p.descriptionEn ?? p.description,
    })
    log(`partners «${p.name}» — ${existing ? 'обновлено' : 'создано'}`)
  }
  for (const patch of landingPartnersPatch) {
    const { docs } = await payload.find({
      collection: 'partners',
      where: { name: { equals: patch.name } },
      limit: 1,
      depth: 0,
      locale: 'ru',
      overrideAccess: true,
    })
    const doc = docs[0]
    if (!doc || (doc.showOnPartnersPage && !force)) continue
    await payload.update({
      collection: 'partners',
      id: doc.id,
      data: {
        showOnPartnersPage: true,
        years: doc.years || patch.years,
        description: doc.description || patch.description,
      },
      locale: 'ru',
      overrideAccess: true,
    })
    log(`partners «${patch.name}» — показывать на странице «Партнёрам»`)
  }

  // Команда
  for (const member of team) {
    let doc = await payload
      .find({
        collection: 'people',
        where: { name: { equals: member.name } },
        limit: 1,
        depth: 0,
        locale: 'ru',
        fallbackLocale: false,
        overrideAccess: true,
      })
      .then((r) => r.docs[0])
    if (!doc) {
      doc = await payload.create({
        collection: 'people',
        data: { name: member.name, ...member.create } as never,
        locale: 'ru',
        overrideAccess: true,
      })
      log(`people «${member.name}» — создано`)
    }
    const roles = new Set([...(doc.roles ?? []), 'team' as const])
    if (force || !doc.teamPosition || roles.size !== (doc.roles ?? []).length) {
      await payload.update({
        collection: 'people',
        id: doc.id,
        data: {
          roles: Array.from(roles),
          teamPosition: doc.teamPosition || member.teamPosition.ru,
          order: doc.order === 100 || force ? member.order : doc.order,
        },
        locale: 'ru',
        overrideAccess: true,
      })
    }
    for (const loc of ['kk', 'en'] as const) {
      const localized = await payload.findByID({
        collection: 'people',
        id: doc.id,
        depth: 0,
        locale: loc,
        fallbackLocale: false,
        overrideAccess: true,
      })
      if (force || !localized.teamPosition) {
        await payload.update({
          collection: 'people',
          id: doc.id,
          data: {
            teamPosition: member.teamPosition[loc],
            ...(loc === 'kk' && 'positionKk' in member && !localized.position
              ? { position: member.positionKk }
              : {}),
          },
          locale: loc,
          overrideAccess: true,
        })
      }
    }
  }

  // Академик: биография и цитата
  const acad = await findBy('people', 'name', academician.name)
  if (acad) {
    for (const loc of ['ru', 'kk'] as const) {
      const localized = await payload.findByID({
        collection: 'people',
        id: acad.id,
        depth: 0,
        locale: loc,
        fallbackLocale: false,
        overrideAccess: true,
      })
      const patch: Record<string, string> = {}
      if (force || !localized.bio) patch.bio = academician.bio[loc]
      if (force || !localized.quote) patch.quote = academician.quote[loc]
      if (Object.keys(patch).length) {
        await payload.update({
          collection: 'people',
          id: acad.id,
          data: patch,
          locale: loc,
          overrideAccess: true,
        })
        log(`people «${academician.name}» [${loc}] — биография и цитата`)
      }
    }
  }

  // Глобалы: заполняем, если заголовок пуст (или force)
  async function fillGlobal(
    slug: 'about-page' | 'partners-page' | 'home-page',
    locale: Loc,
    data: Record<string, unknown>,
    isEmpty: (doc: Record<string, unknown>) => boolean,
  ) {
    const doc = (await payload.findGlobal({
      slug,
      depth: 0,
      locale,
      fallbackLocale: false,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
    if (!force && !isEmpty(doc)) return false
    await payload.updateGlobal({ slug, data: data as never, locale, overrideAccess: true })
    log(`${slug} [${locale}] — заполнено`)
    return true
  }

  const timelineRu = timeline.map((t) => ({
    year: t.year,
    ...t.ru,
    event: t.eventSlug ? (eventIds.get(t.eventSlug) ?? null) : null,
  }))
  const wroteAboutRu = await fillGlobal(
    'about-page',
    'ru',
    { ...about.ru, timeline: timelineRu },
    (d) => !d.heading,
  )
  if (wroteAboutRu) {
    // Вехи в kk/en — по id строк русской версии, иначе массив перезапишется.
    const ru = await payload.findGlobal({
      slug: 'about-page',
      depth: 0,
      locale: 'ru',
      overrideAccess: true,
    })
    for (const loc of ['kk', 'en'] as const) {
      await fillGlobal(
        'about-page',
        loc,
        {
          ...about[loc],
          figures: (ru.figures ?? []).map((row, i) => ({
            ...row,
            label: (about[loc].figures as Array<{ label: string }> | undefined)?.[i]?.label ?? row.label,
          })),
          timeline: (ru.timeline ?? []).map((row, i) => {
            const t = timeline[i]?.[loc]
            return t
              ? { ...row, period: t.period ?? row.period, title: t.title, text: t.text ?? row.text }
              : row
          }),
        },
        () => true,
      )
    }
  }

  const wrotePartnersRu = await fillGlobal('partners-page', 'ru', partnersPage.ru, (d) => !d.heading)
  if (wrotePartnersRu) {
    const ru = await payload.findGlobal({
      slug: 'partners-page',
      depth: 0,
      locale: 'ru',
      overrideAccess: true,
    })
    for (const loc of ['kk', 'en'] as const) {
      const formats = partnersPage[loc].formats as Array<{ title: string; text: string }> | undefined
      await fillGlobal(
        'partners-page',
        loc,
        {
          ...partnersPage[loc],
          formats: (ru.formats ?? []).map((row, i) =>
            formats?.[i] ? { ...row, title: formats[i].title, text: formats[i].text } : row,
          ),
        },
        () => true,
      )
    }
  }

  const wroteHomeRu = await fillGlobal(
    'home-page',
    'ru',
    homePage.ru,
    (d) => !(d.hero as { heading?: string } | undefined)?.heading,
  )
  if (wroteHomeRu) await fillGlobal('home-page', 'kk', homePage.kk, () => true)

  log('готово')
}
