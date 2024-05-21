const axios = require('axios')

const { PAGE_ACCESS_TOKEN, FB_PAGE_ID } = require('../config')

const redisClient = require('../services/redis')
const mailersendClient = require('../services/mailersend')

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

/**
 * Method to get product from redis
 *
 * @returns {object} a product from products.json
 *
 * @see "./assets/products.json"
 */
const getProduct = async (productId) => {
  const product = await redisClient.get(String(productId))

  if (!product) return null

  return JSON.parse(product)
}

/**
 * Just an example function of using filtering through array to find product
 *
 * @returns {object} a product from products.json
 *
 * @see "./assets/products.json"
 */
const getProductFromList = async (productId) => {
  const productsJSON = await redisClient.get('page_products')
  if (!productsJSON) return null

  const products = JSON.parse(productsJSON)

  const product = await products.find((product) => product.sku === Number(productId))
  if (!product) return null

  return product
}

/**
 * A handler for the FB Queries such as `/desc`, `/shipping` or `/price`
 * it will send a FB message respond on behalf of the page to the user
 *
 * @param {object} product
 * @param {string} productParam
 * @param {string} senderId
 * @param {string} productId
 */
const handleFBQuery = async (product, productParam, senderId, productId) => {
  if (!product) {
    await sendMessageResponse(senderId, { text: `Product ${productId} does not exist`})
    return
  }

  let responseText = `
Product SKU: ${product.sku}
Product Name: ${product.name}
`

  responseText += `${productParam}: ${product?.[productParam.toLowerCase()]}`

  await sendMessageResponse(senderId, { text: responseText })

  return responseText
}

/**
 * A handler for the FB `/buy` commands
 * it will send an email to the page owner to prepare items for user purchase
 *
 * @param {object} product
 */
const handleFBPurchaseNotification = async (product) => {
  if (!product) {
    console.log('No product found, therefore email notification is skipped')
    return
  }

  await mailersendClient.sendEmail({
    // recipient should be us (the company)
    recipient: {
      email: 'kyapwc@gmail.com',
      name: 'Facebook Messenger Custom Notification',
    },
    subject: 'Facebook Purchase Order Requested',
    content: `
<html>
  <body>
    <p>A user on Facebook has requested the purchase of <b>${product.name}</b> with the below details: </p>
    <img style="padding-left: 40px;" src="${product.image}" alt="${product.name}" />
    <ul>
      <li>Product SKU: ${product.sku}</li>
      <li>Product Name: ${product.name}</li>
      <li>Product Price: $${product.price}</li>
      <li>Product Shipping Fee: $${product.shipping}</li>
    </ul>
    <p>Please ensure to prepare the products on time and check your Facebook Page for related contact information.</p>
  </body>
</html>
`,
  })
}

/**
 * Used to handle facebook webhook events that come in
 * @param {string} senderId
 * @param {{ text: string; }} message
 */
const handleWebhookMessage = async (senderId, message) => {
  if (!message.text) return

  const shouldGreet = await shouldGreetUser(senderId)

  // we don't have to care about the initial hi/hello/good morning since the doc stated:
  // WHEN THE CONTACT SENDS A MESSAGE FOR THE FIRST TIME
  if (shouldGreet) sendMessageResponse(senderId, { text: generateGreeting() })

  // if text includes `/desc`, `/price`, `/shipping` then do below
  const [messagePrefix, productId] = message.text.split(' ')

  const queryPrefixMethods = {
    '/desc': { action: handleFBQuery, productParam: 'Description' },
    '/price': { action: handleFBQuery, productParam: 'Price' },
    '/shipping': { action: handleFBQuery, productParam: 'Shipping' },
    '/buy': { action: handleFBPurchaseNotification },
  }

  const handler = queryPrefixMethods[messagePrefix]
  // if no handler found, immediately return
  if (!handler) return

  const product = await getProduct(productId)
  // const product = await getProductFromList(productId)
  // can also opt for local map / local array using:
  // const products = require('../assets/products.json').reduce((acc, curr) => {
  //  acc[curr.sku] = curr
  //  return acc
  // })
  // const products = require('../assets/products.json')
  // opted to store everything on redis since the requirement stated to have a database technology to be involved

  await handler.action(product, handler?.productParam, senderId, productId)
}

/**
 * Used to send response back to customer by using facebook graphql
 * @param {string} senderId
 * @param {object} response
 */
const sendMessageResponse = async (senderId, response) => {
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

module.exports = {
  sendMessageResponse,
  handleWebhookMessage,
  shouldGreetUser,
  getProduct,
  handleFBQuery,
  handleFBPurchaseNotification,
}
