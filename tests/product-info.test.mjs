import { test, expect } from 'bun:test'
import app from '../src/index.ts'

const path = '/api/affiliate/product-info'
const body = JSON.stringify({ url: 'https://s.shopee.vn/4qGBnNHxda' })

function request(bindings) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }, bindings)
}

test('rejects missing Addlivetag key without calling upstream', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = () => { throw new Error('fetch must not run') }
  try {
    const response = await request({})
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('PRODUCT_DATA_API_KEY_NOT_CONFIGURED')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('sends Addlivetag key only in the upstream header', async () => {
  const originalFetch = globalThis.fetch
  let upstreamUrl
  let upstreamHeaders
  globalThis.fetch = async (url, options) => {
    upstreamUrl = String(url)
    upstreamHeaders = options.headers
    return Response.json({ status: 'success', productInfo: {
      itemId: 1, shopId: 2, productName: 'Sản phẩm', price: 100000,
      commission: 10000,
    } })
  }
  try {
    const response = await request({ ADDLIVETAG_API_KEY: 'test-only-secret' })
    expect(response.status).toBe(200)
    expect(upstreamHeaders['X-API-Key']).toBe('test-only-secret')
    expect(upstreamUrl).not.toContain('test-only-secret')
    expect((await response.json()).data.cashback).toBe(4000)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('reports upstream authorization failure without exposing the key', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('unauthorized', { status: 401 })
  try {
    const response = await request({ ADDLIVETAG_API_KEY: 'test-only-secret' })
    expect(response.status).toBe(502)
    const payload = await response.json()
    expect(payload.error.code).toBe('PRODUCT_DATA_AUTH_ERROR')
    expect(JSON.stringify(payload)).not.toContain('test-only-secret')
  } finally {
    globalThis.fetch = originalFetch
  }
})
