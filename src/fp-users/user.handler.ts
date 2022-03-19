import type { FastifyPluginCallback } from 'fastify'
import type { Repositories } from 'types'
import { commit, isUniqueErr, rollback, startTrx } from 'fp-repository'

export const setupRoutes = ({
  fpUserRepository: userRepository,
  pool,
}: Repositories): FastifyPluginCallback => (fastify, otps, done) => {
  fastify.get('/next-id', async () => {
    const nextId = await userRepository.nextId()

    return {
      nextId,
    }
  })

  // select all columns
  fastify.get<{
    Params: { id: string }
  }>('/:id/all', async ({ params }) => {
    const user = await userRepository.findOne(params.id)

    return {
      user: user ?? null,
    }
  })
  // select certain columns
  fastify.get<{
    Params: { id: string }
  }>('/:id', async ({ params }) => {
    const user = await userRepository.findOne(params.id, {
      select: ['id', 'name', 'email']
    })

    return {
      user: user ?? null,
    }
  })

  fastify.post<{
    Body: {
      name: string
      email: string
      password: string
    }
  }>('/', async ({ body }, res) => {
    const tx = await startTrx(pool)
    try {
      const user = await userRepository.create({
        name: body.name,
        email: body.email,
        hash: body.password,
      }, tx)

      await commit(tx)

      res.status(201)
      return {
        user: user ?? null,
      }
    } catch (e) {
      await rollback(tx)

      if (isUniqueErr(e)) {
        res.status(400)
        return {
          message: 'User aleady exist!',
        }
      }

      throw e
    } finally {
      tx.release()
    }
  })

  done()
}
