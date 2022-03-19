import type { AnyObject, ColumnData } from './types'

export function buildAliasMapper<T extends AnyObject>(obj: Record<keyof T, ColumnData>) {
  const _mapper = new Map<keyof T, string>()

  for (const [key, value] of Object.entries(obj)) {
    _mapper.set(key, typeof value === 'string'
      ? value
      : value.name)
  }

  return (col: keyof T): string => `"${_mapper.get(col)!}"`
}

export const insertValues = (values: any[]) => values.map((_, index) => `$${index + 1}`).join(', ')
