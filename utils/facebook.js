const axios = require('axios')

const { PAGE_ACCESS_TOKEN, FB_PAGE_ID } = require('../config')

const redisClient = require('../services/redis')

/**
 * Function to decide if the first time greeting should be responded back to user
 *
 * Increment the senderId key in redis to check if greeting has to be sent
 *
 * @param {string} senderId
 * @returns {Promise<boolean>} a boolean value, whether to continue the respond to user or not
 */
const shouldGreetUser = async (senderId) => {
  const existing = await redisClient.get(senderId)

  if (Number(existing) >= 1) {
    console.log(`Already greeted user: ${senderId}`)
    await redisClient.incr(senderId)
    return false
  }

  console.log(`Should greet user: ${senderId}`)
  await redisClient.set(senderId, 1)
  return true
}

/**
 * Just a list of random greetings taken from requirements
 * @type {string[]}
 */
const greetings = [
  'How are you?',
  'I hope you\'re doing well.',
  'I hope you\'re having a great day.',
  'Thank you for reaching out.',
]

/**
 * Function to get a randomised greeting from the `greetings` array
 *
 * @returns {string} A random greeting from the `greetings` array
 *
 * @see greetings
 */
const generateGreeting = () => {
  const index = Math.floor(Math.random() * greetings.length)
  return greetings[index]
}

const getProduct = async (productId) => {
  const product = await redisClient.get(String(productId))

  if (!product) return null

  return JSON.parse(product)
}

const getProductFromList = async (productId) => {
  const productsJSON = await redisClient.get('page_products')
  if (!productsJSON) return null

  const products = JSON.parse(productsJSON)

  const product = await products.find((product) => product.sku === Number(productId))
  if (!product) return null

  return product
}

/**
 * Used to handle facebook webhook events that come in
 * @param {string} senderId
 * @param {{ text: string; }} message
 */
module.exports.handleWebhookMessage = async (senderId, message) => {
  if (!message.text) return

  const shouldGreet = await shouldGreetUser(senderId)

  // we don't have to care about the initial hi/hello/good morning since the doc stated:
  // WHEN THE CONTACT SENDS A MESSAGE FOR THE FIRST TIME
  if (shouldGreet) {
    this.sendMessageResponse(senderId, { text: generateGreeting })
  }

  // if text includes `/desc`, `/price`, `/shipping` then do below
  const queryPrefixMethods = {
    '/desc': 'Description',
    '/price': 'Price',
    '/shipping': 'Shipping',
  }
  const [messagePrefix, productId] = message.text.split(' ')

  if (Object.keys(queryPrefixMethods).includes(messagePrefix)) {
    const product = await getProduct(productId)
    // below just slower compared to direct key-value map
    // const product = await getProductFromList(productId)

    const productParameter = queryPrefixMethods[messagePrefix]

    if (!product) return

    let responseText = `
Product SKU: ${productId}
Product Name: ${product.name}
`

    responseText += `${productParameter}: ${product?.[productParameter.toLowerCase()]}`

    this.sendMessageResponse(senderId, { text: responseText })
  }
}

/**
 * Used to send response back to customer by using facebook graphql
 * @param {string} senderId
 * @param {object} response
 */
module.exports.sendMessageResponse = async (senderId, response) => {
  // will just use simple message without meta template messages
  // due to having to backpack on either facebook urls or facebook attachment upload api which is inconvenient
  // https://developers.facebook.com/docs/messenger-platform/send-messages/template/media
  // and the generic template has 80 character limit on subtitle which is not ideal
  // https://developers.facebook.com/docs/messenger-platform/reference/templates/generic
  const body = {
    recipient: { id: senderId },
    message: response,
  }

  console.log(`Messsage: ${JSON.stringify(body)} is being sent back to user ${senderId}`)

  try {
    const res = await axios.post(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/messages`, body, {
      params: { access_token: PAGE_ACCESS_TOKEN },
      headers: { 'Content-Type': 'application/json' },
    })

    console.log('res: ', res.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('Failed to send message due to axios error: ', error.response)
      return
    }

    console.log('Failed to send message, with error: ', error)
  }
}
