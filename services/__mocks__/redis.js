const redis = jest.createMockFromModule('redis')

redis.createClient = () => ({
  connect: () => {},
  on: () => {},
})

module.exports = redis
