const debug = require(`debug`)(`contentful-text-search:transform`)

/*
Strip contentful entries down to the barebones info
Put ID and content type at top level of object, remove reference fields, and remove the 'sys' part of the object
@param {array} entries - An array of entries

e.g. convert an entry like
{
  sys: { ... }
  fields: {
    locale1: { ... },
    locale2: { ... }
  }
}
to:
{
  id: 'xxx'
  type: 'xxx'
  locale1: { ... },
  locale2: { ... }
}
*/
const reduceEntries = entries =>
  entries.map(entry => {
    try {
      const newEntry = { id: entry.sys.id, type: entry.sys.contentType.sys.id }
      const locales = Object.keys(entry.fields)
      locales.forEach(localeName => {
        newEntry[localeName] = {}
        const localisedFields = entry.fields[localeName]
        Object.keys(localisedFields).forEach(fieldName => {
          if (!Array.isArray(localisedFields[fieldName])) {
            newEntry[localeName][fieldName] = localisedFields[fieldName]
          }
        })
      })
      return newEntry
    } catch (err) {
      debug(`Error removing useless info: %s`, err)
      debug(`Entry: %O`, entry)
      return {}
    }
  })

/*
Strip contentful content types down to the barebones info
@param {array} contentTypes - an array of content types
*/
const reduceContentTypes = contentTypes =>
  contentTypes.map(type => {
    return {
      name: type.sys.id,
      title: type.displayField,
      fields: type.fields.map(field => {
        return {
          name: field.id,
          type: field.type,
        }
      }),
    }
  })

module.exports = {
  reduceEntries,
  reduceContentTypes,
}
