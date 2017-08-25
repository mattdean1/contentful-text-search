const checkEnv = require(`check-env`)
const importEnvVars = require(`dotenv`).config

const Contentful = require(`./src/contentful`)

// Check required env vars are set
importEnvVars()
checkEnv([`CF_SPACE_ID`, `CF_ACCESS_TOKEN`])

const cf = new Contentful(process.env.CF_SPACE_ID, process.env.CF_ACCESS_TOKEN)

const getAndResolveEntries = () => {
  cf
    .getEntries()
    // have to use anonymous func here instead of .then(resolve) or 'this' class scope gets lost
    .then(entries => cf.resolveReferences(entries))
    .then(entries => {
      console.log(JSON.stringify(entries, null, 2))
    })
}

getAndResolveEntries()
//setTimeout(getAndResolveEntries, 5000)
