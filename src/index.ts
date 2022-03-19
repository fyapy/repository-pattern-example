import type { Repositories } from 'types'
import fastify from 'fastify'
import { connectPostgres } from 'db'
import * as fpUsers from 'fp-users'
import * as users from 'users'

const main = async () => {
  const app = fastify({
    trustProxy: true,
  })
  const pool = await connectPostgres()


  const repositories: Repositories = {
    pool,
    userRepository: new users.UserRepository(pool),
    fpUserRepository: fpUsers.fpUserRepository(pool),
  }

  app.register(users.setupRoutes(repositories), {
    prefix: '/users',
  })
  app.register(fpUsers.setupRoutes(repositories), {
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
