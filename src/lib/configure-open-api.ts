import { swaggerUI } from '@hono/swagger-ui'
import type { AppOpenAPI } from './types'

function getYesterdayInVietnam(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(yesterday)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function configureOpenAPI(app: AppOpenAPI) {
  // OpenAPI JSON Schema Endpoint lấy server URL động từ env hoặc request origin
  app.get('/openapi.json', (c) => {
    const serverUrl = c.env?.SERVER_URL || new URL(c.req.url).origin
    const yesterday = getYesterdayInVietnam()
    const document = app.getOpenAPI31Document({
      openapi: '3.1.0',
      info: {
        title: 'Unofficial Shopee Affiliate API',
        version: '1.0.0',
        description: `- API hỗ trợ người làm Affiliate
- Lưu ý: Đây là tài liệu **Unofficial API**, không phải Open API của Shopee Affiliate
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
    })

    const requestSchema = document.components?.schemas?.ConversionReportsRequest as any
    if (requestSchema?.properties) {
      requestSchema.properties.startDate.example = yesterday
      requestSchema.properties.endDate.example = yesterday
    }

    const requestContent = document.paths?.['/api/affiliate/conversion-reports']?.post?.requestBody as any
    const jsonContent = requestContent?.content?.['application/json']
    if (jsonContent) {
      jsonContent.example = {
        shopeeCookies: '',
        startDate: yesterday,
        endDate: yesterday,
        limit: 20,
        page: 1,
      }
    }

    return c.json(document)
  })

  // Swagger UI Documentation at /docs
  app.get(
    '/docs',
    swaggerUI({
      url: '/openapi.json',
      title: 'Unofficial Shopee Affiliate API',
      manuallySwaggerUIHtml: (assets) => `
        <div id="swagger-ui"></div>
        <section class="cookie-guide" aria-labelledby="cookie-guide-title">
          <h2 id="cookie-guide-title">Hướng dẫn lấy Cookies</h2>
          <ol>
            <li>Đăng nhập tại <a href="https://affiliate.shopee.vn" target="_blank" rel="noopener noreferrer">Shopee Affiliate</a>.</li>
            <li>Nhấn <strong>F12</strong> để mở DevTools, sau đó chọn tab <strong>Network</strong>.</li>
            <li>Tải lại trang và chọn một request gửi đến <code>affiliate.shopee.vn</code>.</li>
            <li>Trong <strong>Headers</strong> → <strong>Request Headers</strong>, tìm và sao chép toàn bộ giá trị của header <code>Cookie</code>.</li>
            <li>Dán giá trị vừa sao chép vào trường <code>shopeeCookies</code> khi gọi API.</li>
          </ol>
          <img class="cookie-guide__image" src="/images/example.jpg" alt="Minh họa cách lấy Cookies Shopee Affiliate" loading="lazy" />
          <p class="cookie-guide__warning"><strong>Lưu ý:</strong> Cookies chứa thông tin đăng nhập. Không chia sẻ công khai và hãy lấy lại Cookies khi phiên đăng nhập hết hạn.</p>
        </section>
        ${assets.css.map((url) => `<link rel="stylesheet" href="${url}" />`).join('')}
        <style>
          .cookie-guide {
            box-sizing: border-box;
            max-width: 1460px;
            margin: 24px auto 48px;
            padding: 24px 20px;
            border: 1px solid #d8dde3;
            border-radius: 4px;
            background: #fff;
            box-shadow: 0 1px 2px rgba(0, 0, 0, .1);
            color: #3b4151;
            font-family: sans-serif;
          }
          .cookie-guide h2 { margin: 0 0 16px; font-size: 24px; }
          .cookie-guide ol { margin: 0; padding-left: 24px; line-height: 1.7; }
          .cookie-guide a { color: #4990e2; }
          .cookie-guide code {
            padding: 2px 5px;
            border-radius: 4px;
            background: #f0f2f4;
            font-family: monospace;
          }
          .cookie-guide__image {
            display: block;
            width: 100%;
            height: auto;
            margin-top: 18px;
            border: 1px solid #d8dde3;
            border-radius: 4px;
          }
          .cookie-guide__warning {
            margin: 18px 0 0;
            padding: 12px 16px;
            border-left: 4px solid #f59e0b;
            background: #fffbeb;
          }
          @media (max-width: 1499px) {
            .cookie-guide { margin-right: 20px; margin-left: 20px; }
          }
        </style>
        ${assets.js.map((url) => `<script src="${url}" crossorigin="anonymous"><\/script>`).join('')}
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              dom_id: '#swagger-ui',
              url: '/openapi.json',
            })
          }
        <\/script>
      `,
    }),
  )
}
