import type { Pool, PoolClient } from 'pg'
import { PGRepository, queryRow, ID } from 'repository'

export interface User {
  id: number
  name: string
  email: string
  hash?: string
  createdAt: string
}

export class UserRepository extends PGRepository<User> {
  constructor(pool: Pool) {
    super({
      pool,
      table: 'users',
      mapping: {
        id: 'id',
        name: 'name',
        email: 'email',
        hash: {
          name: 'password_hash',
          hidden: true,
        },
        createdAt: 'created_at',
      },
    })
  }

  async nextId(tx?: PoolClient) {
    const row = await queryRow<{ nextval: string }>(`SELECT nextval('${this.table}_${this.primaryKey}_seq')`, null, tx)
    return Number(row.nextval)
  }

  async isTodayCreated(id: ID, tx?: PoolClient) {
    const user = await this.findOne(id, {
      select: ['createdAt'],
      tx,
    })

    if (!user) {
      throw new Error(`User with id '${id}' don't exist`)
    }

    const userDate = new Date(user.createdAt).getTime()
    const todayDate = new Date().getTime()
    const dayOffset = 3600 * 1000 * 24

    return userDate + dayOffset > todayDate
  }
}
