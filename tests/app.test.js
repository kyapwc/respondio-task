const request = require('supertest')

const app = require('../app')
const { VERIFY_TOKEN } = require('../config')
const facebookUtils = require('../utils/facebook')

jest.mock('axios')
// jest.mock('../services/redis')
jest.mock('../services/mailersend')
jest.mock('../utils/facebook')

describe('Server test', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET `/` path', () => {
    test('it should respond to the GET method on `/` path', async () => {
      const response = await request(app).get('/')
      expect(response.statusCode).toBe(200)
      expect(response.text).toBe('Hello World')
    })
  })

  describe('GET `/webhook` path', () => {
    test('it should acknowledge the webhook registration', async () => {
      const response = await request(app).get('/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'WEBHOOK_VERIFIED',
      })

      expect(response.text).toBe('WEBHOOK_VERIFIED')
      expect(response.statusCode).toBe(200)
    })

    test('it should return status 403 for unauthorised webhook registration', async () => {
      const response = await request(app).get('/webhook').query({
        'hub.mode': 'pushd',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'WEBHOOK_VERIFIED',
      })

      expect(response.text).toBe('Forbidden')
      expect(response.statusCode).toBe(403)
    })
  })

  describe('POST `/webhook` path', () => {
    test('it should return 404 for non-page webhooks being sent', async () => {
      const body = {
        object: 'non_body',
        entry: [
          {
            time: 1716218177258,
            id: '299363169933948',
            messaging: [
              {
                sender: { id: '7515118498566214' },
                recipient: { id: '299363169933948' },
                timestamp: 1716218176568,
                message: {
                  mid: 'm_fgOWnaCL4f6R1W1ba9NtrYONrbM4zAOEYg_nNJh0ExOq54Qp9CXnMeDnZ3P_KvrAnw-Z_HE4YcKrNJaw6QGx7A',
                  text: 'lkj'
                }
              }
            ]
          }
        ]
      }

      const response = await request(app)
        .post('/webhook')
        .send(body)
        .set('Content-Type', 'application/json')

      expect(response.text).toBe('Not Found')
      expect(response.statusCode).toBe(404)
    })

    test('it should return status 200 and EVENT_RECEIVED message', async () => {
      const body = {
        object: 'page',
        entry: [
          {
            time: 1716218177258,
            id: '299363169933948',
            messaging: [
              {
                sender: { id: '7515118498566214' },
                recipient: { id: '299363169933948' },
                timestamp: 1716218176568,
                message: {
                  mid: 'm_fgOWnaCL4f6R1W1ba9NtrYONrbM4zAOEYg_nNJh0ExOq54Qp9CXnMeDnZ3P_KvrAnw-Z_HE4YcKrNJaw6QGx7A',
                  text: 'something'
                }
              }
            ]
          }
        ]
      }
      const handleWebhookMessageSpy = jest.spyOn(facebookUtils, 'handleWebhookMessage')

      const response = await request(app)
        .post('/webhook')
        .send(body)
        .set('Content-Type', 'application/json')

      expect(handleWebhookMessageSpy).toHaveBeenCalledTimes(1);
      expect(handleWebhookMessageSpy.mock.calls[0][0]).toEqual(body.entry[0].messaging[0].sender.id)
      expect(handleWebhookMessageSpy.mock.calls[0][1]).toMatchObject(body.entry[0].messaging[0].message)
      expect(response.text).toBe('EVENT_RECEIVED')
      expect(response.statusCode).toBe(200)
    })
  })
})
