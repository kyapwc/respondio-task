const express = require('express')
const bodyParser = require('body-parser')

require('dotenv').config()
// require to init redis service
require('./services/redis')
require('./services/mailersend')

const { VERIFY_TOKEN } = require('./config')
const { handleWebhookMessage } = require("./utils/facebook")

const app = express()

// Setup bodyparser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// setup initial home
app.get('/', (req, res) => {
  res.send('Hello World')
})

/**
 * `/webhook` route using `GET` method.
 * This is used mainly for verifying webhook registration with facebook
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token && (mode === 'subscribe' && token === VERIFY_TOKEN)) {
    console.log('WEBHOOK_VERIFIED, with data: ', req.query)
    return res.status(200).send(challenge)
  }

  return res.sendStatus(403)
})

/**
 * `/webhook` route using `POST` method.
 * This is used mainly for consuming the messages received from FB webhooks
 */
app.post('/webhook', (req, res) => {
  const body = req.body

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0]

      const senderId = webhookEvent.sender.id

      if (webhookEvent?.message) {
        handleWebhookMessage(senderId, webhookEvent.message)
      }
    })

    return res.status(200).send('EVENT_RECEIVED')
  }

  return res.sendStatus(404)
})

module.exports = app
