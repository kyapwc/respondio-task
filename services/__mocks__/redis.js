const redis = jest.createMockFromModule('redis')

const localCachedMem = {
  'item_1': JSON.stringify({
    sku: '123',
    image: 'http://img.bbystatic.com/BestBuy_US/images/products/3465/346575_rc.jpg',
    description: '123 item description',
    name: '123 item name',
    shipping: 0,
    price: 5,
  }),
  'item_2': JSON.stringify({
    sku: '456',
    image: 'http://img.bbystatic.com/BestBuy_US/images/products/3465/346575_rc.jpg',
    description: '456 item description',
    name: '456 item name',
    shipping: 0,
    price: 16.0,
  }),
  'item_3': JSON.stringify({
    sku: '789',
    image: 'http://img.bbystatic.com/BestBuy_US/images/products/3465/346575_rc.jpg',
    description: '789 item description',
    name: '789 item name',
    shipping: 0,
    price: 10,
  }),
}

redis.createClient = () => ({
  connect: () => {},
  on: () => {},
  set: (key, value) => localCachedMem[key] = value,
  get: (key) => {
    console.log('key: ', key, localCachedMem)
    return localCachedMem[key]
  },
  incr: (key) => localCachedMem[key] += 1,
})

module.exports = redis
