const debug = require(`debug`)(`contentful-text-search:redis`)
const client = require(`./redis-client`)

/*
  Storing a single entry
*/
const storeEntry = async entry => {
  try {
    return await client.setAsync(
      `contentful:entry:${entry.sys.id}`,
      JSON.stringify(entry)
    )
  } catch (err) {
    debug(`Error storing entry: %O`, entry)
    throw new Error(err)
  }
}
const removeEntry = async entry => {
  try {
    return await client.delAsync(`contentful:entry:${entry.sys.id}`)
  } catch (err) {
    debug(`Error removing entry: %O`, entry)
    throw new Error(err)
  }
}

/*
  Storing multiple entries
*/
const getAllEntries = async () => {
  debug(`Getting all entries from cache`)
  try {
    // Filter keys by our naming convention
    const entryKeys = await client.keysAsync(`contentful:entry:*`)
    const entries = await client.mgetAsync(entryKeys)
    return entries.map(JSON.parse)
  } catch (err) {
    debug(`Error getting entries from cache: %s`, err)
    throw new Error(err)
  }
}
const storeEntries = async entries => {
  debug(`Storing %d entries`, entries.length)
  try {
    return await Promise.all(entries.map(storeEntry))
  } catch (err) {
    debug(`Error storing entries: %O`, entries)
  }
}
const removeEntries = async entries => {
  debug(`Removing %d entries`, entries.length)
  try {
    return await Promise.all(entries.map(removeEntry))
  } catch (err) {
    debug(`Error removing entries: %O`, entries)
  }
}

module.exports = {
  storeEntries,
  removeEntries,
  getAllEntries,
}
