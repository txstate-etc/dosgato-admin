import { getIntrospectionQuery, buildClientSchema } from 'graphql'
import { Cache } from 'txstate-utils'
import { api } from '$lib'

const schemaCache = new Cache(async () => {
  const introspectionResult = await api.query(getIntrospectionQuery())
  return buildClientSchema(introspectionResult)
})

export async function load () {
  return { schema: await schemaCache.get() }
}
