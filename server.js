const app = require('./app')
const { PORT } = require('./config')
const redisClient = require('./services/redis')

// setup listener on $PORT
const server = app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received, closing HTTP server and removing connection to redis')

  server.close(() => {
    redisClient.quit()
  })
})

