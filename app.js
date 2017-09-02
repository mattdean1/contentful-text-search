const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config

const ContentfulTextSearch = require(`./src/main`)

// Check required env vars are set
importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

const cts = new ContentfulTextSearch({
  space: process.env.CF_SPACE_ID,
  token: process.env.CF_ACCESS_TOKEN,
  elasticLogLevel: `info`,
})

// cts.indexer.fullReindex().then(() => {
//   cts.query(`intro`, `en-US`)
// })
cts.query(`intro`, `en-US`)
