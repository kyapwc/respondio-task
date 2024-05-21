const PORT = process.env.PORT || 3000
const VERIFY_TOKEN = process.env.VERIFY_TOKEN
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
const FB_PAGE_ID = process.env.FB_PAGE_ID
const MAILERSEND_TOKEN = process.env.MAILERSEND_TOKEN

const REDIS_HOST = 'localhost'
const REDIS_PORT = '6379'
const REDIS_PASSWORD = ''

module.exports = {
  PORT,
  VERIFY_TOKEN,
  PAGE_ACCESS_TOKEN,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  FB_PAGE_ID,
  MAILERSEND_TOKEN,
}
