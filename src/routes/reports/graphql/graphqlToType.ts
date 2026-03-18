import {
  type GraphQLSchema,
  type GraphQLOutputType,
  type SelectionSetNode,
  TypeInfo,
  visit,
  visitWithTypeInfo,
  parse,
  isNonNullType,
  isListType,
  isScalarType,
  isEnumType,
  isObjectType,
  isAbstractType,
  getNamedType,
  Kind
} from 'graphql'

const SCALAR_MAP: Record<string, string> = {
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  ID: 'string',
  DateTime: 'string',
  UrlSafePath: 'string',
  UrlSafeString: 'string',
  FilenameSafePath: 'string',
  FilenameSafeString: 'string',
  LargeInt: 'number',
  JsonData: 'any',
  SchemaVersion: 'string'
}

function typeToTS (type: GraphQLOutputType, nullable = true): string {
  if (isNonNullType(type)) return typeToTS(type.ofType, false)
  const inner = isListType(type)
    ? `(${typeToTS(type.ofType)})[]`
    : (() => {
        const named = getNamedType(type)
        if (!named) return 'unknown'
        if (isScalarType(named)) return SCALAR_MAP[named.name] ?? 'unknown'
        if (isEnumType(named)) return named.getValues().map(v => JSON.stringify(v.value)).join(' | ')
        return 'unknown'
      })()
  return nullable ? `${inner} | null` : inner
}

function selectionSetToTS (schema: GraphQLSchema, selectionSet: SelectionSetNode, parentType: GraphQLOutputType, indent: string): string {
  const named = getNamedType(parentType)
  if (!named || (!isObjectType(named) && !isAbstractType(named))) return 'unknown'

  const fields: string[] = []
  const possibleTypes = isAbstractType(named) ? schema.getPossibleTypes(named) : [named]
  const fieldMap = new Map<string, GraphQLOutputType>()
  for (const t of possibleTypes) {
    if (isObjectType(t)) {
      for (const [name, field] of Object.entries(t.getFields())) {
        fieldMap.set(name, field.type)
      }
    }
  }

  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const name = selection.alias?.value ?? selection.name.value
      if (selection.name.value === '__typename') {
        fields.push(`${indent}  ${name}: string`)
        continue
      }
      const fieldType = fieldMap.get(selection.name.value)
      if (!fieldType) continue
      if (selection.selectionSet) {
        const innerNamed = getNamedType(fieldType)
        const objectType = selectionSetToTS(schema, selection.selectionSet, fieldType, indent + '  ')
        const isNonNull = isNonNullType(fieldType)
        const unwrapped = isNonNull ? fieldType.ofType : fieldType
        if (isListType(unwrapped)) {
          const nullSuffix = isNonNull ? '' : ' | null'
          const itemNullable = !isNonNullType(unwrapped.ofType)
          const itemNullSuffix = itemNullable ? ' | null' : ''
          fields.push(`${indent}  ${name}: (${objectType}${itemNullSuffix})[]${nullSuffix}`)
        } else {
          const nullSuffix = isNonNull ? '' : ' | null'
          fields.push(`${indent}  ${name}: ${objectType}${nullSuffix}`)
        }
      } else {
        fields.push(`${indent}  ${name}: ${typeToTS(fieldType)}`)
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (selection.selectionSet) {
        const fragmentType = selection.typeCondition
          ? schema.getType(selection.typeCondition.name.value) as GraphQLOutputType ?? parentType
          : parentType
        const inner = selectionSetToTS(schema, selection.selectionSet, fragmentType, indent)
        // merge inline fragment fields into parent
        fields.push(inner.replace(/^\{[\n]/, '').replace(/[\n]\s*\}$/, ''))
      }
    }
    // Named fragments would need a full document analysis; skip for now
  }

  return `{\n${fields.join('\n')}\n${indent}}`
}

/** Generate a TypeScript type declaration for the result of a GraphQL query. */
export function graphqlQueryToTypeScript (schema: GraphQLSchema, query: string): string {
  try {
    const doc = parse(query)
    const typeInfo = new TypeInfo(schema)
    const operations: string[] = []

    visit(doc, visitWithTypeInfo(typeInfo, {
      OperationDefinition: {
        enter (node) {
          const opType = node.operation === 'query'
            ? schema.getQueryType()
            : node.operation === 'mutation'
              ? schema.getMutationType()
              : schema.getSubscriptionType()
          if (!opType || !node.selectionSet) return
          const body = selectionSetToTS(schema, node.selectionSet, opType, '')
          operations.push(`type QueryResult = ${body}`)
        }
      }
    }))

    if (!operations.length) return ''
    return operations[0] + '\ndeclare const data: QueryResult\n'
  } catch {
    return ''
  }
}
