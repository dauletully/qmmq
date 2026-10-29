import type { Endpoint } from 'payload'

import { amocrmEndpoints } from './amocrm'
import { formsEndpoint } from './forms'

// Корневые endpoints Payload, доступны по /api/<path>.
export const endpoints: Endpoint[] = [formsEndpoint, ...amocrmEndpoints]
