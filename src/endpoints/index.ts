import type { Endpoint } from 'payload'

import { amocrmEndpoints } from './amocrm'
import { formsEndpoint } from './forms'
import { subscribersExportEndpoint } from './subscribers'

// Корневые endpoints Payload, доступны по /api/<path>.
export const endpoints: Endpoint[] = [formsEndpoint, ...amocrmEndpoints, subscribersExportEndpoint]
