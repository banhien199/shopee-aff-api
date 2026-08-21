import { configureOpenAPI } from './lib/configure-open-api'
import { createApp } from './lib/create-app'
import router from './routes'

const app = createApp()

// Root path tự động chuyển hướng sang trang Docs
app.get('/', (c) => c.redirect('/docs'))

// Gắn các API routes
app.route('/', router)

// Cấu hình OpenAPI spec & Scalar UI (/docs)
configureOpenAPI(app)

export default app
