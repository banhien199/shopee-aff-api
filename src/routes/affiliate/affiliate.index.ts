import { createRouter } from '../../lib/create-app'
import { conversionReportsHandler, convertLinkHandler } from './affiliate.handlers'
import { conversionReportsRoute, convertLinkRoute } from './affiliate.routes'

const router = createRouter()
  .openapi(convertLinkRoute, convertLinkHandler)
  .openapi(conversionReportsRoute, conversionReportsHandler)

export default router
