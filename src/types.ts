import type { Pool } from 'pg'
import type { UserRepository } from 'users'
import type { fpUserRepository } from 'fp-users'

export interface Repositories {
  pool: Pool
  userRepository: UserRepository
  fpUserRepository: ReturnType<typeof fpUserRepository>
}
