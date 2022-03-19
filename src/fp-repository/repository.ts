import { Pool, PoolClient } from 'pg'
import { buildAliasMapper, insertValues } from './queryBuilder'
import {
  MakeAllOptional,
  BaseRepository,
  FindOptions,
  ID,
  ColumnData,
} from './types'
import { query, queryRow } from './utils'

export function pgRepository<T>({
  pool,
  table,
  mapping,
  primaryKey = 'id',
}: {
  table: string
  pool: Pool
  primaryKey?: string
  mapping: Record<keyof T, ColumnData>
}) {
  // constructor
  const aliasMapper = buildAliasMapper<T>(mapping)

  const columnAlias = aliasMapper
  const cols = (...args: Array<keyof T>) => args.map(key => `${aliasMapper(key)} AS "${key}"`).join(', ')
  const allColumns = Object.entries(mapping).reduce((acc, [key, value]: [string, ColumnData]) => {
    if (typeof value === 'object' && value.hidden) {
      return acc
    }

    const sql = `${aliasMapper(key as keyof T)} AS "${key}"`

    return acc
      ? acc += `, ${sql}`
      : sql
  }, '')
  const where = (values: Partial<T>, initialIndex = 0) => {
    const sql = Object.keys(values).reduce((acc, key, index) => {
      const condition = `${aliasMapper(key as keyof T)} = $${index + initialIndex + 1}`

      return acc === ''
        ? `${acc} ${condition}`
        : `${acc}AND ${condition}`
    }, '')

    return `WHERE ${sql}`
  }
  // constructor end


  // methods
  async function create(value: MakeAllOptional<T>, tx?: PoolClient): Promise<T> {
    const _cols: string[] = []
    const _values: any[] = []

    for (const key of Object.keys(value) as Array<keyof T>) {
      _cols.push(columnAlias(key))
      _values.push(value[key])
    }

    const cols = _cols.join(', ')
    const values = insertValues(_values)

    const row = await queryRow<T>(
      `INSERT INTO ${table} (${cols}) VALUES (${values}) RETURNING ${allColumns}`,
      _values,
      tx,
    )

    return row
  }

  async function createMany(values: MakeAllOptional<T>[], tx?: PoolClient): Promise<T[]> {
    const _cols: string[] = []
    const _values: any[][] = []

    for (const value of values) {
      const keys = Object.keys(value) as Array<keyof T>

      for (const key of keys) {
        if (_cols.length !== keys.length) _cols.push(columnAlias(key))

        _values.push(value[key] as any)
      }
    }

    const cols = _cols.join(', ')
    const inlinedValues = values
      .map((_, index) => `(${_cols.map((_, cIndex) => {
        const offset = index !== 0
          ? _cols.length * index
          : 0

        return `$${cIndex + 1 + offset}`
      })})`)
      .join(', ')

    const rows = await query<T>(`
      INSERT INTO ${table} (${cols})
      VALUES ${inlinedValues}
      RETURNING ${allColumns}
    `, _values, tx)

    return rows
  }

  function update(id: ID, newValue: Partial<T>, tx?: PoolClient): Promise<T> {
    const sqlSet = Object.keys(newValue).reduce((acc, key, index) => {
      const sql = `${columnAlias(key as keyof T)} = $${index + 2}`

      return acc
        ? `, ${sql}`
        : sql
    }, '')

    return queryRow<T>(
      `UPDATE ${table} SET ${sqlSet} WHERE "${primaryKey}" = $1 RETURNING ${allColumns}`,
      [id, ...Object.values(newValue)],
      tx,
    )
  }

  function del(id: ID, tx?: PoolClient): Promise<boolean> {
    return queryRow<boolean>(`DELETE FROM ${table} WHERE "${primaryKey}" = $1`, [id], tx)
  }

  async function find(value: Partial<T>, options: FindOptions<T, PoolClient> = {}): Promise<T[]> {
    const sqlCols = options.select
      ? cols(...options.select)
      : allColumns

    const sql = `SELECT ${sqlCols} FROM ${table} ${where(value)}`

    const res = await query<T>(sql, Object.values(value), options.tx)

    return res
  }

  async function findOne(id: ID | Partial<T>, options: FindOptions<T, PoolClient> = {}): Promise<T> {
    const isPrimitive = typeof id !== 'object'
    const sqlCols = options.select
      ? cols(...options.select)
      : allColumns
    const values = isPrimitive
      ? [id]
      : Object.values(id)

    let sql = `SELECT ${sqlCols} FROM ${table}`

    if (isPrimitive) {
      sql += ` WHERE "${primaryKey}" = $1`
    } else {
      sql += ` ${where(id)}`
    }

    const res = await queryRow<T>(sql, values, options.tx)

    return res
  }

  async function exist(id: ID | Partial<T>, tx?: PoolClient): Promise<boolean> {
    let sql = `SELECT COUNT(*)::integer as count FROM ${table}`
    const isPrimitive = typeof id !== 'object'
    const values = isPrimitive
      ? [id]
      : Object.values(id)

    if (isPrimitive) {
      sql += ` WHERE "${primaryKey}" = $1`
    } else {
      sql += ` ${where(id)}`
    }

    sql += ' LIMIT 1'

    const res = await queryRow<{ count: number }>(sql, values, tx)

    return res.count !== 0
  }

  return {
    pool,
    table,
    primaryKey,
    allColumns,
    columnAlias,
    where,
    cols,
    ...({
      create,
      createMany,
      update,
      delete: del,
      find,
      findOne,
      exist,
    } as BaseRepository<T, PoolClient>),
  }
}
