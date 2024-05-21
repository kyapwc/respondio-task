const redis = require('redis')

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = require('../config')
const { waitFor } = require('../utils')
const products = require('../assets/products.json')

/**
 * Redis class for initialising redis instance and ensuring the reconnection in case of any redis server errors
 */
class Redis {
  constructor() {
    this.config = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      socket: {
        // wait for this.retryTimeout milliseconds to retry connectioon if it fail unexpectedly
        connectTimeout: this.retryTimeout,
        reconnectStrategy: (retries) => {
          // every 10 retry, reset the shouldLogError message
          if (retries % 10 === 0) this.shouldLogError = true
          return Math.min(retries * 50, 1000)
        },
      },
    }

    this.retryTimeout = 5000
    this.createClient()
  }

  async createClient() {
    this.client = redis.createClient(this.config)
    try {
      this.client.connect()

      this.client.on('connect', () => console.log('Redis client is attempting connection...'))
    } catch (error) {
      console.error(error)
      await waitFor(this.retryTimeout)
      await this.createClient()
      return
    }

    // ensure to add handler to the error event
    // show error message only on every 10 fail reconnect attempts
    this.client.on('error', (err) => {
      if (this.shouldLogError) console.error('Redis service encounter error: ', err)
      this.shouldLogError = false
    })

    this.client.on('ready', () => {
      console.log('Redis client connected successfully..')
      this.seedDatabase()
    })
  }

  renew() {
    console.log('trying to reconnect to redis...')
    this.quit()
    this.createClient()
    this.reconnecting = null
  }

  quit() {
    if (this.client) {
      this.client.quit()
    }
  }

  // 2 types of seed (1 is seed based on product.sku, other one is entire array into redis)
  async seedDatabase() {
    products.forEach((product) => {
      // product.sku is the product's ID in a e-commerce context
      // set into a map to be able to immediately GET the product
      try {
        this.client.set(String(product.sku), JSON.stringify(product))
      } catch (error) {
        console.log('error: ', error)
      }
    })

    this.client.set('page_products', JSON.stringify(products))
  }
}

const redisClient = new Redis()

module.exports = redisClient.client
