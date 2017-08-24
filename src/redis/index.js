import * as client from "./redis"

/*
  Getter and setter for storing our contentful sync token
*/
export const getSyncToken = async () =>
  await client.getAsync(`contentful:synctoken`)
export const setSyncToken = async token =>
  await client.setAsync(`contentful:synctoken`, token)

// CRUD for single pieces of data
const storeEntry = async entry =>
  await client.setAsync(`contentful:entry:${entry.sys.id}`, entry)

const removeEntry = async entry =>
  await client.delAsync(`contentful:entry:${entry.sys.id}`)

/*
  CRUD for arrays of data
*/
export const storeEntries = async entries =>
  await Promise.all(entries.map(storeEntry))

export const removeEntries = async entries =>
  await Promise.all(entries.map(removeEntry))

export const getAllEntries = async () => {
  // Filter keys by our naming convention
  const entryKeys = await client.keysAsync(`contentful:entry:*`)
  return await client.mgetAsync(entryKeys)
}

/*
  Get by ID
*/
//  Get a single entry from cache by its ID
const getEntryById = async id => await client.getAsync(id)

// Get a number of entries from cache by passing in an array of IDs
export const getEntriesById = async ids =>
  await Promise.all(ids.map(getEntryById))
