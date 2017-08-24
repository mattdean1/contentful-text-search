const debug = require(`debug`)(`contentful-text-search:redis`)
const client = require(`./redis-client`)

/*
  Storing our contentful sync token
*/
const getSyncToken = async () => {
  debug(`Getting sync token`)
  try {
    const syncToken = await client.getAsync(`contentful:synctoken`)
    return syncToken
  } catch (err) {
    debug(`Error getting sync token: %s`, err)
    return false
  }
}
const setSyncToken = async token => {
  debug(`Setting sync token`)
  try {
    return await client.setAsync(`contentful:synctoken`, token)
  } catch (err) {
    debug(err)
    return false
  }
}

/*
  Storing a single entry
*/
const storeEntry = async entry => {
  debug(`Storing entry: %O`, entry)
  try {
    return await client.setAsync(
      `contentful:entry:${entry.sys.id}`,
      JSON.stringify(entry)
    )
  } catch (err) {
    debug(`Error storing entry: %s`, err)
    return false
  }
}
const removeEntry = async entry => {
  debug(`Deleting entry: %O`, entry)
  return await client.delAsync(`contentful:entry:${entry.sys.id}`)
}

/*
  Storing multiple entries
*/
const getAllEntries = async () => {
  debug(`Getting all entries from cache`)
  // Filter keys by our naming convention
  const entryKeys = await client.keysAsync(`contentful:entry:*`)
  const entries = await client.mgetAsync(entryKeys)
  debug(`Got entries from cache: %O`, entries)
  return entries
}
const storeEntries = async entries => {
  debug(`Storing %d entries`, entries.length)
  debug(`Entries: %O`, entries)
  return await Promise.all(entries.map(storeEntry))
}
const removeEntries = async entries => {
  debug(`Removing %d entries`, entries.length)
  debug(`Entries: %O`, entries)
  return await Promise.all(entries.map(removeEntry))
}

// /*
//   Get by ID
// */
// //  Get a single entry from cache by its ID
// const getEntryById = async id => await client.getAsync(id)
//
// // Get a number of entries from cache by passing in an array of IDs
// const getEntriesById = async ids => await Promise.all(ids.map(getEntryById))

module.exports = {
  getSyncToken,
  setSyncToken,
  storeEntries,
  removeEntries,
  getAllEntries,
}
