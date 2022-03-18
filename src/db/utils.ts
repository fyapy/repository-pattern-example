export const parsePostgresUrl = (url: string) => {
  const sl1 = url.split(':')

  const firstPart = sl1[1].replace('//', '')
  const splittedFirstPart = firstPart.split('@')

  const host = splittedFirstPart[1]
  const userCredentials = splittedFirstPart[0].split(':')
  const user = userCredentials[0]
  const password = userCredentials[1]

  const splittedSecondPart = sl1[2].split('/')

  const port = Number(splittedSecondPart[0])
  const database = splittedSecondPart[1]

  return {
    host,
    user,
    password,
    port,
    database,
  }
}
