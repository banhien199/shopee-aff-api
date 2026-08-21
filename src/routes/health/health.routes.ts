import { createRoute, z } from '@hono/zod-openapi'

export const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  operationId: 'getHealthCheck',
  tags: ['System'],
  summary: 'Healcheck',
  description: 'Server heal-check.',
  responses: {
    200: {
      description: 'Hệ thống hoạt động bình thường',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'ok' }),
            environment: z.string().openapi({ example: 'development' }),
            timestamp: z.string().openapi({ example: '2026-08-21T03:57:00.000Z' }),
          }),
        },
      },
    },
  },
})

export type HealthRoute = typeof healthRoute
