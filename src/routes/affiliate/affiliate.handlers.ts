import type { AppRouteHandler } from '../../lib/types'
import type { ConversionReportsRoute, ConvertLinkRoute } from './affiliate.routes'

// 1. Handler: Convert Link Affiliate (Hỗ trợ tối đa 5 link & advancedLinkParams subId1 -> subId5)
export const convertLinkHandler: AppRouteHandler<ConvertLinkRoute> = async (c) => {
  const { shopeeCookies, originalLink, subId1, subId2, subId3, subId4, subId5 } = c.req.valid('json')
  const shopeeBaseApi = c.env?.SHOPEE_BASE_API || 'https://affiliate.shopee.vn/api/v3'

  // Chuẩn hóa endpoint
  const baseUrl = shopeeBaseApi.replace(/\/+$/, '')
  const endpoint = baseUrl.includes('/gql') ? baseUrl : `${baseUrl}/gql?q=batchCustomLink`

  const query = `
    query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller) {
      batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller) {
        shortLink
        longLink
        failCode
      }
    }
  `

  const formattedLinkParams = originalLink.slice(0, 5).map((link) => ({
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://affiliate.shopee.vn',
      referer: 'https://affiliate.shopee.vn/',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
      cookie: shopeeCookies,
    },
    body: JSON.stringify(payload),
  })

  // Đọc text response an toàn để tránh SyntaxError nếu Shopee trả về HTML
  const rawText = await response.text()

  try {
    const json = JSON.parse(rawText)
    return c.json(json, response.status as any)
  } catch {
    return c.json(
      {
        error: 'NON_JSON_RESPONSE',
        status: response.status,
        message: 'Shopee trả về phản hồi không phải JSON (có thể do Cookie không hợp lệ hoặc bị chặn)',
        raw: rawText,
      },
      response.status as any,
    )
  }
}

// 2. Handler: Báo cáo Chuyển đổi (Conversion Reports) (POST)
export const conversionReportsHandler: AppRouteHandler<ConversionReportsRoute> = (c) => {
  const { startDate, endDate, status, subId, limit, page } = c.req.valid('json')

  const currentPage = page || 1
  const currentLimit = limit || 20
  const statusFilter = status || 'ALL'

  const mockOrders = [
    {
      orderId: 'SHOPEE_ORD_99182736',
      purchaseTime: '2026-08-21T03:30:00.000Z',
      productName: 'Tai nghe Bluetooth True Wireless ANC Pro Chống ồn',
      itemsCount: 1,
      totalPrice: 350000,
      commission: 42000,
      commissionRate: '12.0%',
      status: 'COMPLETED' as const,
      subId: 'campaign_fb_ads',
    },
    {
      orderId: 'SHOPEE_ORD_88776655',
      purchaseTime: '2026-08-21T02:15:20.000Z',
      productName: 'Củ sạc nhanh 65W GaN Type-C 3 cổng cho Laptop/Điện thoại',
      itemsCount: 2,
      totalPrice: 578000,
      commission: 86700,
      commissionRate: '15.0%',
      status: 'COMPLETED' as const,
      subId: 'banner_top',
    },
    {
      orderId: 'SHOPEE_ORD_55443322',
      purchaseTime: '2026-08-20T18:45:10.000Z',
      productName: 'Bàn phím cơ không dây Bluetooth RGB Hot-swap',
      itemsCount: 1,
      totalPrice: 699000,
      commission: 87375,
      commissionRate: '12.5%',
      status: 'PENDING' as const,
      subId: 'campaign_fb_ads',
    },
    {
      orderId: 'SHOPEE_ORD_11223344',
      purchaseTime: '2026-08-20T10:12:00.000Z',
      productName: 'Chuột không dây công thái học Silent Click',
      itemsCount: 1,
      totalPrice: 220000,
      commission: 26400,
      commissionRate: '12.0%',
      status: 'CANCELLED' as const,
      subId: 'tiktok_bio',
    },
  ]

  let filtered = mockOrders
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter((o) => o.status === statusFilter)
  }
  if (subId) {
    filtered = filtered.filter((o) => o.subId.toLowerCase().includes(subId.toLowerCase()))
  }

  const totalSales = filtered.reduce((acc, curr) => acc + curr.totalPrice, 0)
  const totalCommission = filtered.reduce((acc, curr) => acc + curr.commission, 0)

  return c.json(
    {
      success: true,
      data: {
        totalOrders: filtered.length,
        totalSales,
        totalCommission,
        page: currentPage,
        limit: currentLimit,
        orders: filtered,
      },
    },
    200,
  )
}
