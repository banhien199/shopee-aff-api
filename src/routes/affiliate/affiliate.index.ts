import { createRouter } from '../../lib/create-app'

import {
  conversionReportsHandler,
  convertLinkHandler,
  productInfoHandler,
} from './affiliate.handlers'

import {
  conversionReportsRoute,
  convertLinkRoute,
  productInfoRoute,
} from './affiliate.routes'

const router = createRouter()
  .openapi(productInfoRoute, productInfoHandler)
  .openapi(convertLinkRoute, convertLinkHandler)
  .openapi(conversionReportsRoute, conversionReportsHandler)

export default router
