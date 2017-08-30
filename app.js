const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config
const ContentfulSyncRedis = require(`contentful-sync-redis`)

const transforms = require(`./src/transformations`)

// Check required env vars are set
importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

const cf = new ContentfulSyncRedis({
  space: process.env.CF_SPACE_ID,
  token: process.env.CF_ACCESS_TOKEN,
})

const log = entries => {
  console.log(JSON.stringify(entries, null, 2))
}

const getAndResolveEntries = async () => {
  //const ct = await cf.client.getContentTypes()
  try {
    const entries = await cf.getEntries()
    const resolvedEntries = await cf.resolveReferences(entries)

    // todo for each locale put into a different index
    const transformedEntries = transforms.removeUselessInfo(resolvedEntries)
    log(transformedEntries)
    process.exit(0)
  } catch (err) {
    console.log(err)
  }
}

getAndResolveEntries()
//setTimeout(getAndResolveEntries, 5000)
