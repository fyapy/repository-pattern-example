import type { Pool, PoolClient } from 'pg'
import { PGRepository, queryRow } from 'repository'

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
    const row = await queryRow<{ nextval: string }>("SELECT nextval('users_id_seq')", null, tx)
    return Number(row.nextval)
  }
}
