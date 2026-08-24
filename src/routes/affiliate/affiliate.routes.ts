import { createRoute, z } from '@hono/zod-openapi'

// ============================================================================
// 1. SCHEMAS: Convert Link Affiliate
// ============================================================================

export const ConvertLinkBodySchema = z
  .object({
    originalLink: z
      .array(
        z
          .string()
          .url('Mỗi đường dẫn gốc phải là một URL hợp lệ')
          .openapi({
            example: 'https://shopee.vn/product/12345678/87654321',
          }),
      )
      .min(1, 'Cần ít nhất 1 link để convert')
      .max(5, 'Tối đa 5 link mỗi lượt convert')
      .openapi({
        description:
          '🔴 [BẮT BUỘC] Mảng chứa từ 1 đến 5 đường dẫn sản phẩm/chiến dịch Shopee',
        example: [
          'https://shopee.vn/product/12345678/87654321',
          'https://shopee.vn/product/88889999/11112222',
        ],
      }),

    subId1: z
      .string()
      .optional()
      .default('')
      .openapi({
        example: 'sub1',
        description:
          '🟢 [TÙY CHỌN] Mã tracking sub_id 1 (mặc định: "")',
      }),

    subId2: z
      .string()
      .optional()
      .default('')
      .openapi({
        example: 'sub2',
        description:
          '🟢 [TÙY CHỌN] Mã tracking sub_id 2 (mặc định: "")',
      }),

    subId3: z
      .string()
      .optional()
      .default('')
      .openapi({
        example: 'sub3',
        description:
          '🟢 [TÙY CHỌN] Mã tracking sub_id 3 (mặc định: "")',
      }),

    subId4: z
      .string()
      .optional()
      .default('')
      .openapi({
        example: 'sub4',
        description:
          '🟢 [TÙY CHỌN] Mã tracking sub_id 4 (mặc định: "")',
      }),

    subId5: z
      .string()
      .optional()
      .default('')
      .openapi({
        example: 'sub5',
        description:
          '🟢 [TÙY CHỌN] Mã tracking sub_id 5 (mặc định: "")',
      }),
  })
  .openapi('ConvertLinkRequest', {
    example: {
      originalLink: [
        'https://shopee.vn/product/1453748726/41457868721',
        'https://s.shopee.vn/AKYyTrle9L',
      ],
      subId1: 'PIGGYTEST001',
    },
  })

export const ShopeeBatchCustomLinkItemSchema = z.object({
  shortLink: z
    .string()
    .nullable()
    .optional()
    .openapi({
      example: 'https://s.shopee.vn/xyz123',
    }),

  longLink: z
    .string()
    .nullable()
    .optional()
    .openapi({
      example: 'https://shope.ee/an_redir?...',
    }),

  failCode: z
    .number()
    .openapi({
      example: 0,
      description: '0 là thành công, khác 0 là mã lỗi Shopee',
    }),
})

export const ConvertLinkResponseSchema = z
  .object({
    data: z
      .object({
        batchCustomLink: z
          .array(ShopeeBatchCustomLinkItemSchema)
          .optional(),
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
              'https://shope.ee/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F12345678%2F87654321&affiliate_id=123456&sub_id=PIGGYTEST001',
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
    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Định dạng ngày bắt đầu phải là YYYY-MM-DD',
      )
      .openapi({
        description:
          '🔴 [BẮT BUỘC] Ngày bắt đầu thống kê (YYYY-MM-DD)',
        example: '2026-08-22',
      }),

    endDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Định dạng ngày kết thúc phải là YYYY-MM-DD',
      )
      .openapi({
        description:
          '🔴 [BẮT BUỘC] Ngày kết thúc thống kê (YYYY-MM-DD)',
        example: '2026-08-22',
      }),

    limit: z
      .union([
        z.literal(20),
        z.literal(40),
        z.literal(100),
      ])
      .openapi({
        example: 20,
        description:
          '🔴 [BẮT BUỘC] Số lượng bản ghi mỗi trang, chỉ chấp nhận: 20, 40 hoặc 100',
      }),

    page: z
      .number()
      .int()
      .min(1)
      .openapi({
        example: 1,
        description:
          '🔴 [BẮT BUỘC] Số thứ tự trang hiện tại',
      }),

    order_id: z
      .string()
      .optional()
      .openapi({
        example: '',
        description:
          '🟢 [TÙY CHỌN] Mã đơn hàng Shopee; được gửi tới Shopee dưới tên order_sn',
      }),

    status: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ])
      .optional()
      .openapi({
        example: 1,
        description:
          '🟢 [TÙY CHỌN] Trạng thái đơn hàng: 1 = Chờ xử lý (Pending), 2 = Đã hoàn thành (Completed), 3 = Đã huỷ (Cancelled), 4 = Chờ người dùng thanh toán (Unpaid)',
      }),
  })
  .openapi('ConversionReportsRequest', {
    example: {
      startDate: '2026-08-22',
      endDate: '2026-08-22',
      limit: 20,
      page: 1,
    },
  })

const ConversionReportItemSchema = z.object({
  item_status: z
    .string()
    .openapi({
      example: 'CANCEL',
      description: 'Trạng thái nội bộ của sản phẩm',
    }),

  display_item_status: z
    .string()
    .openapi({
      example: 'Cancelled',
      description: 'Tên trạng thái sản phẩm để hiển thị',
    }),

  affiliate_item_status: z
    .number()
    .openapi({
      example: 3,
      description: 'Mã trạng thái affiliate của sản phẩm',
    }),

  shop_id: z
    .number()
    .openapi({
      example: 899855963,
      description: 'ID cửa hàng trên Shopee',
    }),

  shop_name: z
    .string()
    .openapi({
      example: 'Aya Mỹ phẩm giá gốc',
      description: 'Tên cửa hàng',
    }),

  promotion_id: z
    .string()
    .openapi({
      example: '',
      description: 'ID chương trình khuyến mãi',
    }),

  model_id: z
    .string()
    .openapi({
      example: '196102823517',
      description: 'ID phân loại sản phẩm',
    }),

  item_id: z
    .number()
    .openapi({
      example: 25879675339,
      description: 'ID sản phẩm trên Shopee',
    }),

  item_name: z
    .string()
    .openapi({
      example:
        'Dầu gội can to Smig 5000ml và 2000ml dùng siêu tiết kiệm , nhiều bọt , tơi tóc , suôn mượt.',
      description: 'Tên sản phẩm',
    }),

  item_price: z
    .number()
    .openapi({
      example: 27500000000,
      description:
        'Giá sản phẩm theo đơn vị tiền nội bộ của Shopee',
    }),

  actual_amount: z
    .number()
    .openapi({
      example: 0,
      description:
        'Giá trị mua thực tế theo đơn vị tiền nội bộ của Shopee',
    }),

  refunded_amount: z
    .number()
    .openapi({
      example: 23100000000,
      description:
        'Số tiền hoàn lại theo đơn vị tiền nội bộ của Shopee',
    }),

  qty: z
    .number()
    .openapi({
      example: 0,
      description: 'Số lượng sản phẩm hợp lệ',
    }),

  img_code: z
    .string()
    .openapi({
      example: 'vn-11134207-7ra0g-magvvbsh5kuva0',
      description: 'Mã ảnh sản phẩm',
    }),

  item_commission: z
    .number()
    .openapi({
      example: 0,
      description:
        'Hoa hồng của sản phẩm theo đơn vị nội bộ Shopee',
    }),

  capped_brand_commission: z
    .number()
    .openapi({
      example: 0,
      description:
        'Hoa hồng thương hiệu sau khi áp dụng giới hạn',
    }),

  global_category_lv1_id: z.number(),
  global_category_lv2_id: z.number(),
  global_category_lv3_id: z.number(),

  global_category_lv1_name: z.string(),
  global_category_lv2_name: z.string(),
  global_category_lv3_name: z.string(),

  is_fraud: z.number(),
  fraud_reason: z.string(),
  fraud_status: z.number(),

  brand_commission_rate: z.number(),
  platform_commission_rate: z.number(),

  attribution_type: z.number(),
  channel: z.number(),

  campaign_mcn_brand_gross_commission: z.string(),

  campaign_type: z.number(),

  ams_order_billing_rate: z.number(),

  brand_origin_commission_rate: z.number(),

  campaign_mcn_origin_commission_rate: z.number(),

  platform_calculation_type: z.number(),

  platform_commission_campaign_source: z.number(),
})

const ConversionReportOrderSchema = z.object({
  order_sn: z
    .string()
    .openapi({
      example: '260819RMXYFVVR',
      description: 'Mã đơn hàng hiển thị trên Shopee',
    }),

  order_id: z
    .string()
    .openapi({
      example: '240847148217240',
      description: 'ID đơn hàng nội bộ Shopee',
    }),

  order_status: z
    .string()
    .openapi({
      example: 'CANCEL',
      description: 'Trạng thái nội bộ của đơn hàng',
    }),

  shop_type: z.number(),

  cancel_reason: z
    .string()
    .openapi({
      example: 'Cancelled by buyer',
      description: 'Lý do huỷ đơn hàng',
    }),

  display_order_status: z
    .number()
    .openapi({
      example: 3,
      description:
        'Mã trạng thái hiển thị: 1 Pending, 2 Completed, 3 Cancelled, 4 Unpaid',
    }),

  complete_time: z.number(),

  fraud_complete_time: z.number(),

  affiliate_transaction_id: z.string(),

  shopee_order_status: z.number(),

  ams_order_billing_order_cap: z.number(),

  is_ams_order_billing_order_capped: z.boolean(),

  is_fixed_fee: z.boolean(),

  items: z
    .array(ConversionReportItemSchema)
    .openapi({
      description:
        'Danh sách sản phẩm thuộc đơn hàng',
    }),
})

const ReportPaymentValidationInfoSchema = z.object({
  validation_cycle: z.number(),
  estimate_validation_month: z.string(),
  estimate_validation_isoweek: z.number(),
  order_estimate_validation_period_start: z.number(),
  order_estimate_validation_period_end: z.number(),
})

const ConversionReportEntrySchema = z.object({
  purchase_time: z.number(),

  checkout_id: z.string(),

  checkout_status: z.string(),

  checkout_status_app: z.number(),

  checkout_cap: z.number(),

  conversion_status: z.number(),

  checkout_complete_time: z.number(),

  affiliate_id: z.number(),

  affiliate_name: z.string(),

  user_status: z.string(),

  ua_type: z.number(),

  gross_commission: z.number(),

  capped_commission: z.number(),

  total_brand_commission: z.number(),

  estimated_total_commission_with_mcn: z.number(),

  estimated_total_commission: z.number(),

  utm_content: z
    .string()
    .openapi({
      example: 'vMpdArQY----',
      description:
        'Giá trị tracking UTM content/subId',
    }),

  content_type: z.string(),

  device: z.string(),

  referrer: z.string(),

  orders: z.array(ConversionReportOrderSchema),

  click_time: z.number(),

  click_id: z.string(),

  product_type: z.string(),

  internal_source: z.string(),

  indirect_source: z.string(),

  direct_source: z.string(),

  last_external_source: z.string(),

  first_external_source: z.string(),

  is_shopee_capped: z.boolean(),

  attribution_type: z.number(),

  estimated_validation_month: z.string(),

  report_payment_validation_info:
    ReportPaymentValidationInfoSchema,

  affiliate_net_commission: z
    .string()
    .openapi({
      example: '0',
      description: 'Hoa hồng ròng của affiliate',
    }),

  mcn_management_fee_commission: z.string(),

  mcn_management_fee_seller_commission: z.string(),

  mcn_agreement_id: z.string(),

  campaign_mcn_id: z.string(),

  campaign_mcn_name: z.string(),

  linked_mcn_id: z.string(),

  linked_mcn_name: z.string(),

  linked_mcn_commission_rate: z.string(),

  tenant: z.number(),

  app_type: z.number(),

  traffic_type: z.number(),

  eligible_seller_commission: z.string(),
})

export const ConversionReportsResponseSchema = z
  .object({
    code: z
      .number()
      .openapi({
        example: 0,
        description: 'Mã kết quả; 0 là thành công',
      }),

    msg: z
      .string()
      .openapi({
        example: 'success',
        description: 'Thông báo kết quả từ Shopee',
      }),

    data: z.object({
      page_num: z.number(),

      page_size: z.number(),

      total_count: z.number(),

      list: z
        .array(ConversionReportEntrySchema)
        .openapi({
          description:
            'Danh sách conversion report',
        }),
    }),
  })
  .openapi('ConversionReportsResponse', {
    description:
      'Phản hồi báo cáo chuyển đổi thành công từ Shopee Affiliate API',
  })

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const ErrorResponseSchema = z
  .object({
    success: z
      .boolean()
      .openapi({
        example: false,
      }),

    error: z.object({
      code: z
        .string()
        .openapi({
          example: 'VALIDATION_ERROR',
        }),

      message: z
        .string()
        .openapi({
          example: 'Dữ liệu yêu cầu không hợp lệ',
        }),

      issues: z
        .array(z.any())
        .optional(),
    }),
  })
  .openapi('ValidationErrorResponse')

export const ShopeeForbiddenErrorSchema = z
  .object({
    is_customized: z.boolean(),

    is_login: z.boolean(),

    action_type: z.number(),

    error: z
      .number()
      .openapi({
        example: 90309999,
        description:
          'Mã lỗi Shopee',
      }),

    tracking_id: z.string(),

    redirect_to_error_page: z.boolean(),
  })
  .openapi('ShopeeForbiddenErrorResponse')

// ============================================================================
// 1. ROUTE: Convert Link Affiliate
// ============================================================================

export const convertLinkRoute = createRoute({
  method: 'post',

  path: '/convert-link',

  operationId: 'convertLinkAffiliate',

  tags: ['Shopee Affiliate'],

  summary: 'Convert Link Affiliate',

  description:
    'Chuyển đổi tối đa 5 link Shopee cùng lúc và hỗ trợ tracking subId1 -> subId5.\n\n' +
    'Cookie Shopee Affiliate được lưu an toàn phía server bằng Cloudflare Secret và không cần gửi trong request.\n\n' +
    '**Chi tiết Body:**\n' +
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

      description:
        'Request body chứa originalLink và subId1..subId5.',
    },
  },

  responses: {
    200: {
      description:
        'Thành công (Trả về danh sách shortLink & longLink tương ứng)',

      content: {
        'application/json': {
          schema: ConvertLinkResponseSchema,
        },
      },
    },

    400: {
      description:
        'Dữ liệu gửi lên không hợp lệ',

      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },

    403: {
      description:
        'Shopee từ chối phiên Affiliate hiện tại',

      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

// ============================================================================
// 2. ROUTE: Conversion Reports
// ============================================================================

export const conversionReportsRoute = createRoute({
  method: 'post',

  path: '/conversion-reports',

  operationId: 'postConversionReports',

  tags: ['Shopee Affiliate'],

  summary:
    'Báo cáo Chuyển đổi (Conversion Reports)',

  description:
    'Truy xuất báo cáo đơn hàng từ Shopee Affiliate.\n\n' +
    'Cookie Shopee Affiliate được lưu phía server bằng Cloudflare Secret và không cần gửi trong request.\n\n' +
    '**Chi tiết Body:**\n' +
    '- 🔴 `startDate` (**Bắt buộc**): Ngày bắt đầu theo định dạng `YYYY-MM-DD`.\n' +
    '- 🔴 `endDate` (**Bắt buộc**): Ngày kết thúc theo định dạng `YYYY-MM-DD`.\n' +
    '- 🔴 `limit` (**Bắt buộc**): `20`, `40` hoặc `100`.\n' +
    '- 🔴 `page` (**Bắt buộc**): Số thứ tự trang.\n' +
    '- 🟢 `order_id` (**Tùy chọn**): Mã đơn hàng Shopee.\n' +
    '- 🟢 `status` (**Tùy chọn**): `1` Pending, `2` Completed, `3` Cancelled, `4` Unpaid.',

  request: {
    body: {
      content: {
        'application/json': {
          schema: ConversionReportsBodySchema,
        },
      },

      required: true,

      description:
        'Thông tin bộ lọc báo cáo.',
    },
  },

  responses: {
    200: {
      description:
        'Truy xuất báo cáo chuyển đổi thành công',

      content: {
        'application/json': {
          schema:
            ConversionReportsResponseSchema,
        },
      },
    },

    400: {
      description:
        'Dữ liệu gửi lên không hợp lệ',

      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },

    403: {
      description:
        'Shopee từ chối phiên Affiliate hiện tại',

      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

export type ConvertLinkRoute =
  typeof convertLinkRoute

export type ConversionReportsRoute =
  typeof conversionReportsRoute
