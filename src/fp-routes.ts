import type { FastifyPluginCallback } from 'fastify'
import type { Pool } from 'pg'
import { isUniqueErr } from 'repository'
import { fpUserRepository } from 'fp-example-of-usage'

export const fpRoutes = (pool: Pool): FastifyPluginCallback => (fastify, otps, done) => {
  const userRepository = fpUserRepository(pool)

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
    try {
      const user = await userRepository.create({
        name: body.name,
        email: body.email,
        hash: body.password,
      })

      res.status(201)
      return {
        user: user ?? null,
      }
    } catch (e) {
      if (isUniqueErr(e)) {
        res.status(400)
        return {
          message: 'User aleady exist!',
        }
      }

      throw e
    }
  })

  done()
}
