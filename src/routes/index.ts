import { createRouter } from '../lib/create-app'
import affiliate from './affiliate/affiliate.index'

const router = createRouter().route('/api/affiliate', affiliate)

export default router
