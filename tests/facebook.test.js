const { VERIFY_TOKEN } = require('../config')
const facebookUtils = require('../utils/facebook')

jest.mock('axios')
// jest.mock('../services/redis')
jest.mock('../services/mailersend')

jest.mock('../utils/facebook', () => {
  const originalModule = jest.requireActual('../utils/facebook')
  return {
    ...originalModule,
    sendMessageResponse: jest.fn(),
  }
})

describe('Facebook Utils test', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#shouldGreetUser', () => {
    it('should return true and then false', async () => {
      const first = await facebookUtils.shouldGreetUser(123)

      const second = await facebookUtils.shouldGreetUser(123)

      expect(first).toEqual(true)
      expect(second).toEqual(false)
    })
  })

  describe('#getProduct', () => {
    it('should return product with sku of item_1', async () => {
      const product = await facebookUtils.getProduct('item_1')

      expect(product).toMatchObject({
        sku: '123',
        image: 'http://img.bbystatic.com/BestBuy_US/images/products/3465/346575_rc.jpg',
        description: '123 item description',
        name: '123 item name',
        shipping: 0,
        price: 5
      })
    })

    it('should not return a product', async () => {
      const product = await facebookUtils.getProduct('asdasdasdasd')

      expect(product).toEqual(null)
    })
  })

  describe('#handleFBQuery', () => {
    it('should respond with product description', async () => {
      const productId = 'item_1'
      const product = await facebookUtils.getProduct(productId)
      const productParam = 'Description'
      const senderId = '123'

      const response = await facebookUtils.handleFBQuery(product, productParam, senderId, productId)
      const expectedResponse = `
Product SKU: ${product.sku}
Product Name: ${product.name}
${productParam}: ${product?.[productParam.toLowerCase()]}
`.trim()
      expect(response.trim()).toEqual(expectedResponse)
    })

    it('should respond with product price', async () => {
      const productId = 'item_1'
      const product = await facebookUtils.getProduct(productId)
      const productParam = 'Price'
      const senderId = '123'

      const response = await facebookUtils.handleFBQuery(product, productParam, senderId, productId)
      const expectedResponse = `
Product SKU: ${product.sku}
Product Name: ${product.name}
${productParam}: ${product?.[productParam.toLowerCase()]}
`.trim()
      expect(response.trim()).toEqual(expectedResponse)
    })

    it('should respond with product shipping price', async () => {
      const productId = 'item_1'
      const product = await facebookUtils.getProduct(productId)
      const productParam = 'Shipping'
      const senderId = '123'

      const response = await facebookUtils.handleFBQuery(product, productParam, senderId, productId)
      const expectedResponse = `
Product SKU: ${product.sku}
Product Name: ${product.name}
${productParam}: ${product?.[productParam.toLowerCase()]}
`.trim()
      expect(response.trim()).toEqual(expectedResponse)
    })
  })
})
