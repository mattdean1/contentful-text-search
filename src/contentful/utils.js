const debug = require(`debug`)(`contentful-text-search:contentful`)

// Recursive func used to resolve links
exports.resolve = (content, entriesMap) => {
  // content is an array
  if (Array.isArray(content)) {
    return content.map(x => this.resolve(x, entriesMap))
  }
  // content is an entry with fields
  if (content.sys && content.sys.type === `Entry`) {
    Object.keys(content.fields).forEach(fieldName => {
      // TODO: support multiple locales - group fields by locale?
      content.fields[fieldName][`en-US`] = this.resolve(
        content.fields[fieldName][`en-US`],
        entriesMap
      )
    })
    return content
  }
  // Content is a reference
  if (
    content.sys &&
    content.sys.type === `Link` &&
    content.sys.linkType === `Entry`
  ) {
    return this.resolve(entriesMap[content.sys.id], entriesMap)
  }
  // content is a value
  return content
}

// create an object with content ID as keys
exports.createEntriesMap = entries => {
  try {
    return entries.reduce(
      (accu, entry) => Object.assign(accu, { [entry.sys.id]: entry }),
      {}
    )
  } catch (err) {
    debug(`entries: %O`, entries)
  }
}
