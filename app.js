const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config
const ContentfulSyncRedis = require(`contentful-sync-redis`)

const transforms = require(`./src/transformations`)
const indexer = require(`./src/indexing`)

// Check required env vars are set
importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

const cf = new ContentfulSyncRedis({
  space: process.env.CF_SPACE_ID,
  token: process.env.CF_ACCESS_TOKEN,
})

const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

const main = async () => {
  try {
    const rawEntries = await cf.getEntries()
    const resolvedEntries = await cf.resolveReferences(rawEntries)
    const { items: contentTypesResponse } = await cf.client.getContentTypes()

    // todo for each locale put into a different index
    const entries = transforms.reduceEntries(resolvedEntries)
    //log(transformedEntries)
    const contentTypes = transforms.reduceContentTypes(contentTypesResponse)
    // log(reducedContentTypes)

    // const mappedEntries = transforms.mapEntriesToES(
    //   entries,
    //   `en-US`,
    //   contentTypes
    // )
    // log(mappedEntries)

    // generate index mapping
    log(indexer.createIndexConfig(contentTypes))

    // index

    process.exit(0)
  } catch (err) {
    console.log(err)
  }
}

main()
//setTimeout(main, 5000)
