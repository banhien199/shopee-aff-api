import { swaggerUI } from '@hono/swagger-ui'
import type { AppOpenAPI } from './types'

export function configureOpenAPI(app: AppOpenAPI) {
  // OpenAPI JSON Schema Endpoint lấy server URL động từ env hoặc request origin
  app.doc('/openapi.json', (c) => {
    const serverUrl = c.env?.SERVER_URL || new URL(c.req.url).origin

    return {
      openapi: '3.1.0',
      info: {
        title: 'Unofficial Shopee Affiliate API',
        version: '1.0.0',
        description: `- API hỗ trợ người làm Affiliate
- Lưu ý: Đây là tài liệu **Unofficial API**, không phải API chính thống từ Shopee Affiliate
- Các API được cung cấp trong tài liệu này:
  1. Convert Link Affiliate
  2. Báo cáo Chuyển đổi (Conversion Reports)`,
      },
      tags: [],
      servers: [
        {
          url: serverUrl,
          description: 'Current Environment Server',
        },
      ],
    }
  })

  // Swagger UI Documentation at /docs
  app.get(
    '/docs',
    swaggerUI({
      url: '/openapi.json',
    }),
  )
}
