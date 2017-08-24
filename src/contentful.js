const debug = require(`debug`)(`contentful-text-search:contentful`)
const { createClient } = require(`contentful`)
const db = require(`./redis`)

// TODO: add try/catch and logging
module.exports = class Contentful {
  constructor(space, accessToken) {
    this.client = createClient({
      space,
      accessToken,
      resolveLinks: false,
      // TODO: support preview api
    })
  }

  // Called the first time we sync redis and contentful e.g. when the server starts
  // Do async stuff here rather than in constructor
  async initialise() {
    debug(`Initialising contentful client`)
    debug(`Performing initial sync`)
    try {
      const clientSyncResponse = await this.client.sync({
        initial: true,
        // Restrict to entries because we only want text
        type: `Entry`,
      })
      // save nextSyncToken to use in the following sync
      await db.setSyncToken(clientSyncResponse.nextSyncToken)
      debug(`storing entries`)
      return await db.storeEntries(clientSyncResponse.entries)
    } catch (err) {
      debug(err)
      return false
    }
  }

  // Get all entries from cache (making sure cache is up to date via syncing first)
  async getEntries() {
    await this.sync()
    return await db.getAllEntries()
  }

  // Called before geting data from CF
  async sync() {
    debug(`second syncing`)
    let syncToken
    try {
      // wait for initial sync to complete
      syncToken = `nil`
      while (syncToken === `nil`) {
        syncToken = await db.getSyncToken()
      }
    } catch (err) {
      debug(`initial sync failed`, err)
      return false
    }

    try {
      const clientSyncResponse = await this.client.sync({
        nextSyncToken: syncToken,
        type: `Entry`,
      })
      if (clientSyncResponse.nextSyncToken == syncToken) {
        // No updates since last sync
        return false
      }
      // There are updates, so capture the sync token, store the new/fresh entries, and delete outdated ones
      await db.setSyncToken(clientSyncResponse.nextSyncToken)
      const { entries, deletedEntries } = clientSyncResponse
      // Use promise.all so these execute in parallel
      await Promise.all([
        db.storeEntries(entries),
        db.removeEntries(deletedEntries),
      ])
      return true
    } catch (err) {
      debug(err)
    }
  }
}
