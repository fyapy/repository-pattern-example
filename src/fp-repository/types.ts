import type { PoolClient } from 'pg'

export type AnyObject = Record<string, any>
export type ColumnData = string | {
  name: string
  hidden?: boolean
}

export type ID = string | number

interface Writer<T, C> {
  create(value: Partial<T>, tx?: C): Promise<T>
  createMany(values: Partial<T>[], tx?: C): Promise<T[]>
  update(id: ID, newValue: Partial<T>, tx?: C): Promise<T>
  delete(id: ID, tx?: C): Promise<boolean>
}

export interface FindOptions<T, C> {
  select?: Array<keyof T>
  tx?: C
}

interface Reader<T, C> {
  find(value: Partial<T>, options?: FindOptions<T, C>): Promise<T[]>
  findOne(id: ID | Partial<T>, options?: FindOptions<T, C>): Promise<T>
  exist(id: ID | Partial<T>, tx?: PoolClient): Promise<boolean>
}

export type BaseRepository<T, C> = Writer<T, C> & Reader<T, C>
