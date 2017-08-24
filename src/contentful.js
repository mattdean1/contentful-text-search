import { createClient } from "contentful"
import * as db from "./redis"

// TODO: add try/catch and logging
export default class ContentfulSync {
  constructor(space, accessToken) {
    this.client = createClient({
      space,
      accessToken,
      resolveLinks: false,
      // TODO: support preview api
    })
    this.firstSync()
  }

  // Get all entries from cache (making sure cache is up to date via syncing first)
  async getEntries() {
    await this.sync()
    return await db.getAllEntries()
  }

  // Called the first time we sync redis and contentful e.g. when the server starts
  async firstSync() {
    const clientSyncResponse = await this.client.sync({
      initial: true,
      // Restrict to entries because we only want text
      type: `Entry`,
    })
    // save nextSyncToken to use in the following sync
    await db.setSyncToken(clientSyncResponse.nextSyncToken)
    return await db.storeEntries(clientSyncResponse.entries)
  }

  // Called before geting data from CF
  async sync() {
    const syncToken = await db.getSyncToken()
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
  }
}
