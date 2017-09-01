const debug = require(`debug`)(`contentful-text-search:transform`)
const marked = require(`marked`)
const PlainTextRenderer = require(`marked-plaintext`)

const renderer = new PlainTextRenderer()

const transform = (entries, locale, contentTypes) => {
  const reducedEntries = reduceEntries(entries)
  const formattedEntries = formatEntries(reducedEntries, locale, contentTypes)
  return mapEntriesToES(formattedEntries)
}

// ES bulk format
// {
//   body: [
//     {
//       index: {
//         _index: process.env.ES_INDEX,
//         _type: doc.type,
//         _id: doc.id,
//       },
//     },
//     { doc },
//   ]
// }
const mapEntriesToES = entries => {
  let body = []
  entries.forEach(entry => {
    body.push({
      index: {
        _index: `testindex`,
        _type: entry.type,
        _id: entry.id,
      },
    })
    delete entry.type
    delete entry.id
    body.push(entry)
  })
  return {
    body,
  }
}

// todo: test with localisation
/*
  Map entries to elasticsearch fields
*/
const formatEntries = (entries, locale, contentTypes) => {
  const newEntries = entries.map(entry => {
    // setup data
    const newEntry = { id: entry.id, type: entry.type }
    const fields = entry[locale]
    const { title: ctTitle, fields: ctFields } = contentTypes[entry.type]

    Object.keys(fields).forEach(fieldName => {
      const fieldType = ctFields[fieldName].type
      const fieldValue = fields[fieldName]
      if (fieldName === ctTitle) {
        // set entry title
        newEntry.title = fieldValue
      } else if (fieldType === `Text`) {
        // convert long text fields from markdown to plaintext
        newEntry[fieldName] = marked(fieldValue, { renderer })
      } else if (fieldType === `Symbol`) {
        // dont need to reformat short text fields
        newEntry[fieldName] = fieldValue
      }
    })

    return newEntry
  })

  // remove entries with no text fields
  return newEntries.filter(entry => Object.keys(entry).length > 2)
}

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
      debug(`Error reducing entries: %s`, err)
      debug(`Entry: %O`, entry)
      return {}
    }
  })

/*
Strip contentful content types down to the barebones info
@param {array} contentTypes - an array of content types
*/
const reduceContentTypes = contentTypes => {
  const barebonesContentType = contentTypes.map(type => {
    const fields = type.fields
      .map(getBarebonesField)
      .reduce(reduceArrayToObj, {})
    return {
      name: type.sys.id,
      title: getTitleField(Object.keys(fields), type.displayField),
      fields,
    }
  })
  return barebonesContentType.reduce(reduceArrayToObj, {})
}
// Used in array.map to filter out some of the fields
const getBarebonesField = field => {
  return {
    name: field.id,
    type: field.type,
  }
}
// Used in array.reduce to convert an array of objects with a name property to an object with those names as it's keys
// e.g. [{name: `x`, field1: `y`}] => {x: { field1: `y` }}
const reduceArrayToObj = (accumulator, obj) => {
  accumulator[obj.name] = obj
  delete accumulator[obj.name].name
  return accumulator
}
// Contentful entry title is always mapped to a field called 'title' (unless there is a field named 'title')
const getTitleField = (fields, ctTitle) => {
  if (Object.keys(fields).includes(`title`)) {
    return `title`
  }
  return ctTitle
}

module.exports = {
  transform,
  reduceContentTypes,
}
