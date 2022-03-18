import type { Pool, PoolClient } from 'pg'
import { pool } from 'db'

export const isUniqueErr = (error: any, table?: string) => {
  if (table) {
    return error.code === '23505' && error.severity === 'ERROR' && error.table === table
  }

  return error.code === '23505' && error.severity === 'ERROR'
}

export const getConnect = (tx?: PoolClient): Promise<PoolClient> => {
  if (tx) {
    return tx as unknown as Promise<PoolClient>
  }
  return pool.connect()
}

export const queryRow = async <T = any>(sql: string, values: any[] | null, tx?: PoolClient): Promise<T> => {
  const client = await getConnect(tx)

  if (Array.isArray(values)) {
    try {
      const res = await client.query(sql, values)

      return (res.command === 'DELETE'
        ? res.rowCount !== 0
        : res.rows[0]) as T
    } catch (e) {
      throw e
    } finally {
      if (!tx) client.release()
    }
  }

  try {
    const res = await client.query(sql)

    return res.rows[0] as T
  } catch (e) {
    throw e
  } finally {
    if (!tx) client.release()
  }
}
export const query = async <T = any>(sql: string, values?: any[] | null, tx?: PoolClient) => {
  const client = await getConnect(tx)

  if (Array.isArray(values)) {
    try {
      const res = await client.query(sql, values)

      return res.rows as T[]
    } catch (e) {
      throw e
    } finally {
      if (!tx) client.release()
    }
  }

  try {
    const res = await client.query(sql)

    return res.rows as T[]
  } catch (e) {
    throw e
  } finally {
    if (!tx) client.release()
  }
}

export const startTrx = async (pool: Pool) => {
  const tx = await pool.connect()
  await tx.query('BEGIN')
  return tx
}
export const commit = (pool: PoolClient) => pool.query('COMMIT')
export const rollback = (pool: PoolClient) => pool.query('ROLLBACK')
