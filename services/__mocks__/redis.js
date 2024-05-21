const redis = jest.createMockFromModule('redis')

const localCachedMem = {}

redis.createClient = () => ({
  connect: () => {},
  on: () => {},
  set: (key, value) => localCachedMem[key] = value,
  get: (key) => localCachedMem[key],
})

module.exports = redis
