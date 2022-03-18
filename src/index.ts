import fastify from 'fastify'
import { connectPostgres } from 'db'
import { fpRoutes } from 'fp-routes'
import { routes } from 'routes'

const main = async () => {
  const app = fastify({
    trustProxy: true,
  })
  const pool = await connectPostgres()

  app.register(routes(pool), {
    prefix: '/users',
  })
  app.register(fpRoutes(pool), {
    prefix: '/fp-users',
  })

  try {
    const url = await app.listen(process.env.PORT || 8080, '0.0.0.0')

    console.log(`Server started: ${url}`)
  } catch (error) {
    console.error('Server starting error:\n', error)
  }
}

main()
