import { createRoute, z } from '@hono/zod-openapi'

// ============================================================================
// 1. SCHEMAS: Convert Link Affiliate
// ============================================================================
export const ConvertLinkBodySchema = z
  .object({
    shopeeCookies: z
      .string()
      .min(1, 'shopeeCookies là bắt buộc để xác thực Shopee Affiliate')
      .openapi({
        example: 'SPC_EC=xxx; SPC_F=xxx; SPC_U=xxx; SPC_R_T_ID=xxx;',
        description: '🔴 [BẮT BUỘC] Chuỗi Cookie đăng nhập tài khoản Shopee Affiliate',
      }),
    originalLink: z
      .array(
        z
          .string()
          .url('Mỗi đường dẫn gốc phải là một URL hợp lệ')
          .openapi({ example: 'https://shopee.vn/product/12345678/87654321' }),
      )
      .min(1, 'Cần ít nhất 1 link để convert')
      .max(5, 'Tối đa 5 link mỗi lượt convert')
      .openapi({
        description: '🔴 [BẮT BUỘC] Mảng chứa từ 1 đến 5 đường dẫn sản phẩm/chiến dịch Shopee',
        example: [
          'https://shopee.vn/product/12345678/87654321',
          'https://shopee.vn/product/88889999/11112222',
        ],
      }),
    subId1: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub1', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 1 (mặc định: "")' }),
    subId2: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub2', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 2 (mặc định: "")' }),
    subId3: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub3', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 3 (mặc định: "")' }),
    subId4: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub4', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 4 (mặc định: "")' }),
    subId5: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub5', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 5 (mặc định: "")' }),
  })
  .openapi('ConvertLinkRequest', {
    example: {
      shopeeCookies: 'SPC_EC=xxx; SPC_F=xxx; SPC_U=xxx; SPC_R_T_ID=xxx;',
      originalLink: [
        'https://shopee.vn/product/12345678/87654321',
        'https://shopee.vn/product/88889999/11112222',
      ],
      subId1: 'campaign_fb',
      subId2: 'banner_top',
      subId3: 'post_123',
      subId4: 'creator_01',
      subId5: 'sale_88',
    },
  })

export const ShopeeBatchCustomLinkItemSchema = z.object({
  shortLink: z.string().nullable().optional().openapi({ example: 'https://s.shopee.vn/xyz123' }),
  longLink: z.string().nullable().optional().openapi({ example: 'https://shope.ee/an_redir?...' }),
  failCode: z.number().openapi({ example: 0, description: '0 là thành công, khác 0 là mã lỗi Shopee' }),
})

export const ConvertLinkResponseSchema = z
  .object({
    data: z
      .object({
        batchCustomLink: z.array(ShopeeBatchCustomLinkItemSchema).optional(),
      })
      .optional(),
    errors: z
      .array(
        z.object({
          message: z.string().optional(),
        }),
      )
      .optional(),
  })
  .openapi('ConvertLinkResponse', {
    example: {
      data: {
        batchCustomLink: [
          {
            shortLink: 'https://s.shopee.vn/8fDxyz123',
            longLink:
              'https://shope.ee/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F12345678%2F87654321&affiliate_id=123456&sub_id=campaign_fb&sub_id2=banner_top&sub_id3=post_123&sub_id4=creator_01&sub_id5=sale_88',
            failCode: 0,
          },
          {
            shortLink: 'https://s.shopee.vn/8fDxyz456',
            longLink:
              'https://shope.ee/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F88889999%2F11112222&affiliate_id=123456&sub_id=campaign_fb&sub_id2=banner_top&sub_id3=post_123&sub_id4=creator_01&sub_id5=sale_88',
            failCode: 0,
          },
        ],
      },
    },
  })

// ============================================================================
// 2. SCHEMAS: Báo cáo Chuyển đổi (Conversion Reports)
// ============================================================================
export const ConversionReportsBodySchema = z
  .object({
    shopeeCookies: z
      .string()
      .min(1, 'shopeeCookies là bắt buộc')
      .openapi({
        example: 'SPC_EC=xxx; SPC_F=xxx; SPC_U=xxx; SPC_R_T_ID=xxx;',
        description: '🔴 [BẮT BUỘC] Chuỗi Cookie đăng nhập tài khoản Shopee Affiliate',
      }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày bắt đầu phải là YYYY-MM-DD')
      .optional()
      .openapi({
        example: '2026-08-01',
        description: '🟢 [TÙY CHỌN] Ngày bắt đầu thống kê (YYYY-MM-DD)',
      }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày kết thúc phải là YYYY-MM-DD')
      .optional()
      .openapi({
        example: '2026-08-21',
        description: '🟢 [TÙY CHỌN] Ngày kết thúc thống kê (YYYY-MM-DD)',
      }),
    status: z
      .enum(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'])
      .optional()
      .default('ALL')
      .openapi({
        example: 'ALL',
        description: '🟢 [TÙY CHỌN] Trạng thái đơn hàng affiliate cần lọc (mặc định ALL)',
      }),
    subId: z
      .string()
      .optional()
      .openapi({
        example: 'campaign_fb_ads',
        description: '🟢 [TÙY CHỌN] Lọc báo cáo theo mã sub_id tracking',
      }),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .openapi({
        example: 20,
        description: '🟢 [TÙY CHỌN] Số lượng bản ghi mỗi trang (mặc định 20, tối đa 100)',
      }),
    page: z
      .number()
      .min(1)
      .optional()
      .default(1)
      .openapi({
        example: 1,
        description: '🟢 [TÙY CHỌN] Số thứ tự trang hiện tại (mặc định 1)',
      }),
  })
  .openapi('ConversionReportsRequest')

export const OrderItemSchema = z.object({
  orderId: z.string().openapi({ example: 'SHOPEE_ORD_88991122' }),
  purchaseTime: z.string().openapi({ example: '2026-08-21T02:15:30.000Z' }),
  productName: z.string().openapi({ example: 'Tai nghe Bluetooth True Wireless ANC Pro' }),
  itemsCount: z.number().openapi({ example: 1 }),
  totalPrice: z.number().openapi({ example: 350000 }),
  commission: z.number().openapi({ example: 42000 }),
  commissionRate: z.string().openapi({ example: '12.0%' }),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).openapi({ example: 'COMPLETED' }),
  subId: z.string().openapi({ example: 'campaign_fb_ads' }),
})

export const ConversionReportsResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      totalOrders: z.number().openapi({ example: 128 }),
      totalSales: z.number().openapi({ example: 45200000 }),
      totalCommission: z.number().openapi({ example: 5424000 }),
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 20 }),
      orders: z.array(OrderItemSchema),
    }),
  })
  .openapi('ConversionReportsResponse')

// ============================================================================
// ERROR SCHEMAS: 400 Validation Error & 403 Forbidden Error (Shopee Cookie Error)
// ============================================================================
export const ErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: false }),
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string().openapi({ example: 'Dữ liệu yêu cầu không hợp lệ' }),
      issues: z.array(z.any()).optional(),
    }),
  })
  .openapi('ValidationErrorResponse')

export const ShopeeForbiddenErrorSchema = z
  .object({
    is_customized: z.boolean().openapi({ example: false }),
    is_login: z.boolean().openapi({ example: false }),
    action_type: z.number().openapi({ example: 2 }),
    error: z.number().openapi({
      example: 90309999,
      description: 'Mã lỗi Shopee (90309999: Chưa đăng nhập hoặc Cookie hết hạn)',
    }),
    tracking_id: z.string().openapi({ example: '461affbb6d8-d3f6-45b8-af44-e049b879ca09' }),
    redirect_to_error_page: z.boolean().openapi({ example: true }),
  })
  .openapi('ShopeeForbiddenErrorResponse')

// ============================================================================
// 1. ROUTE: Convert Link Affiliate (POST)
// ============================================================================
export const convertLinkRoute = createRoute({
  method: 'post',
  path: '/convert-link',
  operationId: 'convertLinkAffiliate',
  tags: ['Shopee Affiliate'],
  summary: 'Convert Link Affiliate',
  description:
    'Chuyển đổi mảng tối đa 5 link Shopee cùng lúc kèm tracking subId1 -> subId5 qua GraphQL batchCustomLink.\n\n' +
    '**Chi tiết Body:**\n' +
    '- 🔴 `shopeeCookies` (**Bắt buộc**): Cookie đăng nhập Shopee Affiliate.\n' +
    '- 🔴 `originalLink` (**Bắt buộc**): Mảng từ 1 đến 5 đường dẫn sản phẩm/chiến dịch Shopee hợp lệ.\n' +
    '- 🟢 `subId1` .. `subId5` (**Tùy chọn**): Các mã tracking mở rộng.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConvertLinkBodySchema,
        },
      },
      required: true,
      description: 'Request body chứa shopeeCookies, originalLink (bắt buộc) và subId1..subId5 (tùy chọn)',
    },
  },
  responses: {
    200: {
      description: 'Thành công (Trả về danh sách shortLink & longLink tương ứng)',
      content: {
        'application/json': {
          schema: ConvertLinkResponseSchema,
        },
      },
    },
    400: {
      description: 'Dữ liệu gửi lên không hợp lệ hoặc thiếu shopeeCookies',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Lỗi xác thực Shopee (Cookie không hợp lệ, hết hạn hoặc chưa đăng nhập)',
      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

// ============================================================================
// 2. ROUTE: Báo cáo Chuyển đổi (Conversion Reports) (POST)
// ============================================================================
export const conversionReportsRoute = createRoute({
  method: 'post',
  path: '/conversion-reports',
  operationId: 'postConversionReports',
  tags: ['Shopee Affiliate'],
  summary: 'Báo cáo Chuyển đổi (Conversion Reports)',
  description:
    'Truy xuất báo cáo chi tiết về đơn hàng, doanh số và hoa hồng nhận được trong khoảng thời gian xác định (yêu cầu shopeeCookies).',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConversionReportsBodySchema,
        },
      },
      required: true,
      description: 'Thông tin bộ lọc báo cáo và shopeeCookies',
    },
  },
  responses: {
    200: {
      description: 'Truy xuất báo cáo chuyển đổi thành công',
      content: {
        'application/json': {
          schema: ConversionReportsResponseSchema,
        },
      },
    },
    400: {
      description: 'Dữ liệu gửi lên không hợp lệ hoặc thiếu shopeeCookies',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Lỗi xác thực Shopee (Cookie không hợp lệ, hết hạn hoặc chưa đăng nhập)',
      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

export type ConvertLinkRoute = typeof convertLinkRoute
export type ConversionReportsRoute = typeof conversionReportsRoute
