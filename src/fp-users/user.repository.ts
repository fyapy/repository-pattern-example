import type { Pool, PoolClient } from 'pg'
import { pgRepository, queryRow } from 'fp-repository'

export interface User {
  id: number
  name: string
  email: string
  hash?: string
  createdAt: string
}

export function fpUserRepository(pool: Pool) {
  const base = pgRepository({
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

  async function nextId(tx?: PoolClient) {
    const row = await queryRow<{ nextval: string }>("SELECT nextval('users_id_seq')", null, tx)
    return Number(row.nextval)
  }

  return {
    ...base,
    nextId,
  }
}
