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
}
