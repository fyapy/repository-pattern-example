import { Pool, PoolClient } from 'pg'
import { buildMapper, insertValues } from './queryBuilder'
import {
  MakeAllOptional,
  BaseRepository,
  FindOptions,
  ID,
  ColumnData,
} from './types'
import { query, queryRow } from './utils'

export class PGRepository<T> implements BaseRepository<T, PoolClient> {
  readonly table: string
  readonly primaryKey: string
  readonly pool: Pool
  readonly mapColumn: (col: keyof T) => string
  readonly cols: (...args: Array<keyof T>) => string
  readonly allColumns: string
  readonly where: (values: Partial<T>, initialIndex?: number) => string

  constructor({
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
    const mapper = buildMapper<T>(mapping)

    this.pool = pool
    this.table = `"${table}"`
    this.mapColumn = mapper
    this.primaryKey = primaryKey

    this.cols = (...args: Array<keyof T>) => args.map(key => `${mapper(key)} AS "${key}"`).join(', ')
    this.allColumns = Object.entries(mapping).reduce((acc, [key, value]: [string, ColumnData]) => {
      if (typeof value === 'object' && value.hidden) {
        return acc
      }

      const sql = `${mapper(key as keyof T)} AS "${key}"`

      return acc
        ? acc += `, ${sql}`
        : sql
    }, '')
    this.where = (values: Partial<T>, initialIndex = 0) => {
      const sql = Object.keys(values).reduce((acc, key, index) => {
        const condition = `${mapper(key as keyof T)} = $${index + initialIndex + 1}`

        return acc === ''
          ? `${acc} ${condition}`
          : `${acc}AND ${condition}`
      }, '')

      return `WHERE ${sql}`
    }
  }


  async create(value: MakeAllOptional<T>, tx?: PoolClient): Promise<T> {
    const _cols: string[] = []
    const _values: any[] = []

    for (const key of Object.keys(value) as Array<keyof T>) {
      _cols.push(this.mapColumn(key))
      _values.push(value[key])
    }

    const cols = _cols.join(', ')
    const values = insertValues(_values)

    const row = await queryRow<T>(
      `INSERT INTO ${this.table} (${cols}) VALUES (${values}) RETURNING ${this.allColumns}`,
      _values,
      tx,
    )

    return row
  }

  async createMany(values: MakeAllOptional<T>[], tx?: PoolClient): Promise<T[]> {
    const _cols: string[] = []
    const _values: any[][] = []

    for (const value of values) {
      const keys = Object.keys(value) as Array<keyof T>

      for (const key of keys) {
        if (_cols.length !== keys.length) _cols.push(this.mapColumn(key))

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
      INSERT INTO ${this.table} (${cols})
      VALUES ${inlinedValues}
      RETURNING ${this.allColumns}
    `, _values, tx)

    return rows
  }

  update(id: ID, newValue: Partial<T>, tx?: PoolClient): Promise<T> {
    const sqlSet = Object.keys(newValue).reduce((acc, key, index) => {
      const sql = `${this.mapColumn(key as keyof T)} = $${index + 2}`

      return acc
        ? `, ${sql}`
        : sql
    }, '')

    return queryRow<T>(
      `UPDATE ${this.table} SET ${sqlSet} WHERE "${this.primaryKey}" = $1 RETURNING ${this.allColumns}`,
      [id, ...Object.values(newValue)],
      tx,
    )
  }

  delete(id: ID, tx?: PoolClient): Promise<boolean> {
    return queryRow<boolean>(
      `DELETE FROM ${this.table} WHERE "${this.primaryKey}" = $1`,
      [id],
      tx,
    )
  }

  async find(value: Partial<T>, options: FindOptions<T, PoolClient> = {}): Promise<T[]> {
    const cols = options.select
      ? this.cols(...options.select)
      : this.allColumns

    const sql = `SELECT ${cols} FROM ${this.table} ${this.where(value)}`

    const res = await query<T>(sql, Object.values(value), options.tx)

    return res
  }

  async findOne(id: ID | Partial<T>, options: FindOptions<T, PoolClient> = {}): Promise<T> {
    const isPrimitive = typeof id !== 'object'
    const cols = options.select
      ? this.cols(...options.select)
      : this.allColumns
    const values = isPrimitive
      ? [id]
      : Object.values(id)

    let sql = `SELECT ${cols} FROM ${this.table}`

    if (isPrimitive) {
      sql += ` WHERE "${this.primaryKey}" = $1`
    } else {
      sql += ` ${this.where(id)}`
    }

    const res = await queryRow<T>(sql, values, options.tx)

    return res
  }

  async exist(id: ID | Partial<T>, tx?: PoolClient): Promise<boolean> {
    let sql = `SELECT COUNT(*)::integer as count FROM ${this.table}`
    const isPrimitive = typeof id !== 'object'
    const values = isPrimitive
      ? [id]
      : Object.values(id)

    if (isPrimitive) {
      sql += ` WHERE "${this.primaryKey}" = $1`
    } else {
      sql += ` ${this.where(id)}`
    }

    sql += ' LIMIT 1'

    const res = await queryRow<{ count: number }>(sql, values, tx)

    return res.count !== 0
  }
}
