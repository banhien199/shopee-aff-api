import type { AppRouteHandler } from '../../lib/types'
import type {
  ConversionReportsRoute,
  ConvertLinkRoute,
  ProductInfoRoute,
} from './affiliate.routes'

// ============================================================================
// Helper
// ============================================================================

function getShopeeCookie(c: any): string | null {
  const cookie = c.env?.SHOPEE_AFFILIATE_COOKIE

  if (typeof cookie !== 'string' || !cookie.trim()) {
    return null
  }

  return cookie.trim()
}

function getShopeeBaseApi(c: any): string {
  return (
    c.env?.SHOPEE_BASE_API ||
    'https://affiliate.shopee.vn/api/v3'
  )
}
// ============================================================================
// Handler: Product Info
// ============================================================================

export const productInfoHandler: AppRouteHandler<
  ProductInfoRoute
> = async (c) => {
  const { url } = c.req.valid('json')

  let productUrl: URL

  try {
    productUrl = new URL(url)
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Link Shopee không hợp lệ',
        },
      },
      400 as any,
    )
  }

  const allowedHosts = new Set([
    'shopee.vn',
    'www.shopee.vn',
    's.shopee.vn',
    'shp.ee',
  ])

  if (!allowedHosts.has(productUrl.hostname)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_SHOPEE_URL',
          message: 'Chỉ hỗ trợ link Shopee Việt Nam',
        },
      },
      400 as any,
    )
  }

  const endpoint = new URL(
    'https://data.addlivetag.com/product-data/product-data.php',
  )

  endpoint.searchParams.set('url', url.trim())

  let response: Response

  try {
    response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: 'PRODUCT_DATA_REQUEST_FAILED',
          message: 'Không thể kết nối tới nguồn dữ liệu sản phẩm',
        },
      },
      502 as any,
    )
  }

  if (!response.ok) {
    return c.json(
      {
        success: false,
        error: {
          code: 'PRODUCT_DATA_HTTP_ERROR',
          message: `Nguồn dữ liệu sản phẩm trả HTTP ${response.status}`,
        },
      },
      502 as any,
    )
  }

  let payload: any

  try {
    payload = await response.json()
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PRODUCT_DATA_RESPONSE',
          message: 'Nguồn dữ liệu sản phẩm trả dữ liệu không hợp lệ',
        },
      },
      502 as any,
    )
  }

  if (
    payload?.status !== 'success' ||
    !payload?.productInfo
  ) {
    return c.json(
      {
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message:
            payload?.message ||
            'Không lấy được thông tin sản phẩm Shopee',
        },
      },
      502 as any,
    )
  }

  const info = payload.productInfo

  const commission =
    typeof info.commission === 'number'
      ? info.commission
      : 0

  const cashback = Math.round(
    commission * 0.4,
  )

  return c.json(
    {
      success: true,
      data: {
        itemId:
          info.itemId !== undefined
            ? String(info.itemId)
            : '',

        shopId:
          info.shopId !== undefined
            ? String(info.shopId)
            : '',

        productName:
          typeof info.productName === 'string'
            ? info.productName
            : '',

        shopName:
          typeof info.shopName === 'string'
            ? info.shopName
            : '',

        price:
          typeof info.price === 'number'
            ? info.price
            : 0,

        imageUrl:
          typeof info.imageUrl === 'string'
            ? info.imageUrl
            : null,

        rating:
          typeof info.rating === 'string'
            ? info.rating
            : null,

        sales:
          typeof info.sales === 'number'
            ? info.sales
            : null,

        cashback,

        dataSource:
          typeof info.dataSource === 'string'
            ? info.dataSource
            : null,
      },
    },
    200 as any,
  )
}
// ============================================================================
// 1. Handler: Convert Link Affiliate
// Hỗ trợ tối đa 5 link + subId1 -> subId5
// ============================================================================

export const convertLinkHandler: AppRouteHandler<
  ConvertLinkRoute
> = async (c) => {
  const {
    originalLink,
    subId1,
    subId2,
    subId3,
    subId4,
    subId5,
  } = c.req.valid('json')

  // Cookie chỉ lấy từ Cloudflare Secret.
  // Không nhận cookie từ request body.
  const shopeeCookies = getShopeeCookie(c)

  if (!shopeeCookies) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SHOPEE_COOKIE_NOT_CONFIGURED',
          message:
            'Shopee Affiliate Cookie chưa được cấu hình trên server',
        },
      },
      500 as any,
    )
  }

  const shopeeBaseApi = getShopeeBaseApi(c)

  // Chuẩn hóa endpoint
  const baseUrl = shopeeBaseApi.replace(/\/+$/, '')

  const endpoint = baseUrl.includes('/gql')
    ? baseUrl
    : `${baseUrl}/gql?q=batchCustomLink`

  const query = `
    query batchGetCustomLink(
      $linkParams: [CustomLinkParam!],
      $sourceCaller: SourceCaller
    ) {
      batchCustomLink(
        linkParams: $linkParams,
        sourceCaller: $sourceCaller
      ) {
        shortLink
        longLink
        failCode
      }
    }
  `

  const formattedLinkParams = originalLink
    .slice(0, 5)
    .map((link) => ({
      originalLink: link,
      advancedLinkParams: {
        subId1: subId1 || '',
        subId2: subId2 || '',
        subId3: subId3 || '',
        subId4: subId4 || '',
        subId5: subId5 || '',
      },
    }))

  const payload = {
    operationName: 'batchGetCustomLink',
    query,
    variables: {
      linkParams: formattedLinkParams,
      sourceCaller: 'CUSTOM_LINK_CALLER',
    },
  }

  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',

        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/133.0.0.0 Safari/537.36',

        'sec-fetch-dest': 'empty',
        'sec-fetch-site': 'same-origin',

        'sec-ch-ua':
          '"Google Chrome";v="149", ' +
          '"Chromium";v="149", ' +
          '"Not)A;Brand";v="24"',

        // Cookie chỉ được gửi từ Worker -> Shopee
        cookie: shopeeCookies,
      },

      body: JSON.stringify(payload),
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SHOPEE_REQUEST_FAILED',
          message:
            'Không thể kết nối tới Shopee Affiliate API',
        },
      },
      502 as any,
    )
  }

  // Đọc text trước để tránh crash khi Shopee trả HTML
  const rawText = await response.text()

  try {
    const json = JSON.parse(rawText)

    return c.json(
      json,
      response.status as any,
    )
  } catch {
    return c.json(
      {
        error: 'NON_JSON_RESPONSE',
        status: response.status,
        message:
          'Shopee trả về phản hồi không phải JSON ' +
          '(có thể do Cookie không hợp lệ hoặc request bị từ chối)',
      },
      response.status as any,
    )
  }
}

// ============================================================================
// 2. Handler: Báo cáo Chuyển đổi (Conversion Reports)
// ============================================================================

export const conversionReportsHandler: AppRouteHandler<
  ConversionReportsRoute
> = async (c) => {
  const {
    startDate,
    endDate,
    limit,
    page,
    order_id,
    status,
  } = c.req.valid('json')

  // Cookie chỉ lấy từ Cloudflare Secret.
  const shopeeCookies = getShopeeCookie(c)

  if (!shopeeCookies) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SHOPEE_COOKIE_NOT_CONFIGURED',
          message:
            'Shopee Affiliate Cookie chưa được cấu hình trên server',
        },
      },
      500 as any,
    )
  }

  const shopeeBaseApi = getShopeeBaseApi(c)

  // Shopee Việt Nam dùng UTC+7
  const purchaseTimeStart = Math.floor(
    new Date(
      `${startDate}T00:00:00+07:00`,
    ).getTime() / 1000,
  )

  const purchaseTimeEnd = Math.floor(
    new Date(
      `${endDate}T23:59:59+07:00`,
    ).getTime() / 1000,
  )

  if (
    !Number.isFinite(purchaseTimeStart) ||
    !Number.isFinite(purchaseTimeEnd)
  ) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'startDate hoặc endDate không hợp lệ',
        },
      },
      400 as any,
    )
  }

  if (purchaseTimeStart > purchaseTimeEnd) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'startDate không được lớn hơn endDate',
        },
      },
      400 as any,
    )
  }

  const baseUrl = shopeeBaseApi.replace(
    /\/+$/,
    '',
  )

  const endpoint = new URL(
    baseUrl.endsWith('/report/list')
      ? baseUrl
      : `${baseUrl}/report/list`,
  )

  const searchParams =
    new URLSearchParams({
      page_num: String(page),
      page_size: String(limit),

      purchase_time_s: String(
        purchaseTimeStart,
      ),

      purchase_time_e: String(
        purchaseTimeEnd,
      ),

      version: '1',
    })

  if (order_id?.trim()) {
    searchParams.set(
      'order_sn',
      order_id.trim(),
    )
  }

  if (status !== undefined) {
    searchParams.set(
      'order_status',
      String(status),
    )
  }

  endpoint.search =
    searchParams.toString()

  let response: Response

  try {
    response = await fetch(
      endpoint.toString(),
      {
        method: 'GET',

        headers: {
          accept: '*/*',
          'content-type':
            'application/json',

          // Cookie chỉ được gửi Worker -> Shopee
          cookie: shopeeCookies,

          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/133.0.0.0 Safari/537.36',

          'sec-fetch-dest': 'empty',
          'sec-fetch-site': 'same-origin',

          'sec-ch-ua':
            '"Google Chrome";v="149", ' +
            '"Chromium";v="149", ' +
            '"Not)A;Brand";v="24"',
        },
      },
    )
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SHOPEE_REQUEST_FAILED',
          message:
            'Không thể kết nối tới Shopee Affiliate API',
        },
      },
      502 as any,
    )
  }

  const rawText =
    await response.text()

  try {
    const json =
      JSON.parse(rawText)

    return c.json(
      json,
      response.status as any,
    )
  } catch {
    return c.json(
      {
        error: 'NON_JSON_RESPONSE',
        status: response.status,
        message:
          'Shopee trả về phản hồi không phải JSON ' +
          '(có thể do Cookie không hợp lệ hoặc request bị từ chối)',
      },
      response.status as any,
    )
  }
}
