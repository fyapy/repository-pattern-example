import { Pool } from 'pg'
import { parsePostgresUrl } from './utils'
import 'dotenv/config'

export let pool: Pool

export const connectPostgres = async () => {
  const config = parsePostgresUrl(process.env.DATABASE_URL!)
  const newPool = new Pool(config)

  await newPool.connect()

  pool = newPool
  return newPool
}
