const debug = require(`debug`)(`contentful-text-search:main`)
const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config

const Contentful = require(`./src/contentful`)

// Check required env vars are set
importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

debug(`Running main`)

const cf = new Contentful(process.env.CF_SPACE_ID, process.env.CF_ACCESS_TOKEN)
cf.initialise().then(() => cf.getEntries()).then(entries => {
  debug(`%O`, entries)
})
