const debug = require(`debug`)(`contentful-text-search:contentful`)
const { createClient } = require(`contentful`)
const db = require(`./redis`)

module.exports = class Contentful {
  constructor(space, accessToken, host) {
    this.client = createClient({
      space,
      accessToken,
      resolveLinks: false,
      host: host || `cdn.contentful.com`,
    })
    this.syncToken = false
  }

  // Get all entries from cache (making sure cache is up to date via syncing first)
  async getEntries() {
    debug(`Getting entries`)
    try {
      await this.sync()
      return await db.getAllEntries()
    } catch (err) {
      debug(`Error getting entries: %s`, err)
      throw new Error(err)
    }
  }

  // Called before geting data from CF, ensures cache is up to date
  async sync() {
    debug(`Syncing`)
    try {
      // Filter by entries only on initial sync since later syncs don't support it
      let query = this.syncToken
        ? { nextSyncToken: this.syncToken }
        : { initial: true, type: `Entry` }
      query.resolveLinks = false
      const clientSyncResponse = await this.client.sync(query)

      if (clientSyncResponse.nextSyncToken === this.syncToken) {
        debug(`No updates since last sync`)
        return Promise.resolve()
      }

      debug(`Sync updates found, updating cache...`)
      this.syncToken = clientSyncResponse.nextSyncToken
      const { entries, deletedEntries } = clientSyncResponse
      // Use promise.all so these execute in parallel
      await Promise.all([
        db.storeEntries(entries),
        db.removeEntries(deletedEntries),
      ])
      return Promise.resolve()
    } catch (err) {
      debug(`Error syncing contentful: %s`, err)
      throw new Error(err)
    }
  }

  // Recursively resolve references in an array of contentful entries
  // TODO: add logging, should this return a promise?
  resolve(content, entriesMap) {
    if (!entriesMap) {
      entriesMap = this.createEntriesMap(content)
    }

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
  createEntriesMap(entries) {
    return entries.reduce(
      (accu, entry) => Object.assign(accu, { [entry.sys.id]: entry }),
      {}
    )
  }
}
