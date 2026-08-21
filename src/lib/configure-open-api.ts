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
  2. Báo cáo Chuyển đổi (Conversion Reports)

[Author: nguyenphiikhanh](https://www.facebook.com/nguyenphiikhanh)`,
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
          <p class="cookie-guide__warning"><strong>Lưu ý:</strong> Cookies có thời hạn. Không chia sẻ công khai, lấy lại Cookies khác khi phiên đăng nhập hết hạn.</p>
        </section>
        <button class="donate-button" id="donate-button" type="button" aria-haspopup="dialog" aria-controls="donate-modal">
          💝 Donate em gói mỳ
        </button>
        <div class="donate-modal" id="donate-modal" role="dialog" aria-modal="true" aria-labelledby="donate-title" hidden>
          <div class="donate-modal__backdrop"></div>
          <div class="donate-modal__content">
            <h2 id="donate-title">API chạy bằng code, dev chạy bằng cà phê ☕</h2>
            <p>Quét nhẹ mã QR — biết đâu bug thấy vậy cũng tự giác biến mất!</p>
            <p>A Di Đà Lạt!</p>
            <img class="donate-modal__qr" src="/images/QR.png" alt="Mã QR donate" />
            <img class="donate-modal__illustration" src="/images/anxin.webp" alt="Ảnh minh họa donate" />
            <div class="donate-modal__actions">
              <button type="button" data-close-donate>Đéo</button>
              <button type="button" data-close-donate>Không cho</button>
              <button type="button" data-close-donate>Vẫn là không cho nhưng nằm ở option khác</button>
              <button type="button" data-close-donate>Cần cù thì bù siêng năng...</button>
            </div>
          </div>
        </div>
        <div class="donate-modal" id="meme-modal" role="dialog" aria-modal="true" aria-labelledby="meme-title" hidden>
          <div class="donate-modal__backdrop"></div>
          <div class="donate-modal__content meme-modal__content">
            <h2 id="meme-title">Á à nhớ cái mặt nhé &lt;3</h2>
            <img class="meme-modal__image" src="/images/jackmeme.png" alt="Jack meme" />
            <button class="meme-modal__button" id="close-meme" type="button">Ô Kê</button>
          </div>
        </div>
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
          .donate-button {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 1000;
            padding: 9px 14px;
            border: 0;
            border-radius: 999px;
            background: #ee4d2d;
            box-shadow: 0 4px 14px rgba(238, 77, 45, .35);
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }
          .donate-button:hover { background: #d94325; }
          .donate-button:focus-visible,
          .donate-modal__actions button:focus-visible { outline: 3px solid rgba(238, 77, 45, .35); outline-offset: 2px; }
          .donate-modal[hidden] { display: none; }
          .donate-modal {
            position: fixed;
            inset: 0;
            z-index: 1100;
            display: grid;
            place-items: center;
            padding: 20px;
            font-family: sans-serif;
          }
          .donate-modal__backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, .58);
          }
          .donate-modal__content {
            position: relative;
            box-sizing: border-box;
            width: 700px;
            padding: 20px 26px;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 20px 50px rgba(0, 0, 0, .25);
            color: #3b4151;
            text-align: center;
          }
          .donate-modal__content h2 { margin: 0 0 6px; font-size: 22px; }
          .donate-modal__content p { margin: 0 0 10px; line-height: 1.4; }
          .donate-modal__qr {
            display: block;
            width: 420px;
            max-height: 360px;
            height: auto;
            margin: 0 auto;
            border-radius: 8px;
            object-fit: contain;
          }
          .donate-modal__illustration {
            display: block;
            width: 65px;
            max-width: 30%;
            height: auto;
            margin: 6px auto 0;
          }
          .donate-modal__actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          .donate-modal__actions button {
            min-height: 42px;
            padding: 8px 12px;
            border: 1px solid #ee4d2d;
            border-radius: 8px;
            background: #fff;
            color: #d94325;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }
          .donate-modal__actions button:hover { background: #fff3f0; }
          .meme-modal__content { width: 520px; }
          .meme-modal__image {
            display: block;
            width: 100%;
            max-height: 480px;
            height: auto;
            margin: 14px auto;
            border-radius: 8px;
            object-fit: contain;
          }
          .meme-modal__button {
            min-width: 120px;
            padding: 10px 20px;
            border: 0;
            border-radius: 8px;
            background: #ee4d2d;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .meme-modal__button:hover { background: #d94325; }
          .meme-modal__button:focus-visible { outline: 3px solid rgba(238, 77, 45, .35); outline-offset: 2px; }
          body.donate-modal-open { overflow: hidden; }
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

            const donateButton = document.getElementById('donate-button')
            const donateModal = document.getElementById('donate-modal')
            const memeModal = document.getElementById('meme-modal')
            const closeMemeButton = document.getElementById('close-meme')
            const openDonate = () => {
              if (!donateModal.hidden || !memeModal.hidden) return
              donateModal.hidden = false
              document.body.classList.add('donate-modal-open')
              donateModal.querySelector('[data-close-donate]').focus()
            }
            const showMeme = () => {
              donateModal.hidden = true
              memeModal.hidden = false
              closeMemeButton.focus()
            }
            const closeMeme = () => {
              memeModal.hidden = true
              document.body.classList.remove('donate-modal-open')
              donateButton.focus()
            }

            donateButton.addEventListener('click', openDonate)
            donateModal.querySelectorAll('[data-close-donate]').forEach((element) => {
              element.addEventListener('click', showMeme)
            })
            closeMemeButton.addEventListener('click', closeMeme)

            openDonate()
            window.setInterval(openDonate, 3 * 60 * 1000)
          }
        <\/script>
      `,
    }),
  )
}
