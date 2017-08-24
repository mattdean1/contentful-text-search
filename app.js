const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config

const Contentful = require(`./src/contentful`)

importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

const cf = new Contentful(process.env.CF_SPACE_ID, process.env.CF_ACCESS_TOKEN)

cf.getEntries().then(console.log)
