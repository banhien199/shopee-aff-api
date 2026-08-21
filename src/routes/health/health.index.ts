import { createRouter } from '../../lib/create-app'
import { healthHandler } from './health.handlers'
import { healthRoute } from './health.routes'

const router = createRouter().openapi(healthRoute, healthHandler)

export default router
