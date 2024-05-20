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
const shouldPromptFirstTimeResponse = async (senderId) => {
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
 * Used to handle facebook webhook events that come in
 * @param {string} senderId
 * @param {{ text: string; }} message
 */
module.exports.handleWebhookMessage = async (senderId, message) => {
  let response = {}

  // we don't have to care about the initial hi/hello/good morning since the doc stated:
  // WHEN THE CONTACT SENDS A MESSAGE FOR THE FIRST TIME
  if (message.text) {
    response = { text: generateGreeting() }
  }

  const shouldRespond = await shouldPromptFirstTimeResponse(senderId)

  if (shouldRespond) this.sendMessageResponse(senderId, response)
}

/**
 * Used to send response back to customer by using facebook graphql
 * @param {string} senderId
 * @param {object} response
 */
module.exports.sendMessageResponse = async (senderId, response) => {
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
