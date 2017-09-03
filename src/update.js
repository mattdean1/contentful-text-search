const debug = require(`debug`)(`contentul-text-search:update`)
const tunnel = require(`contentful-webhook-tunnel`)

module.exports = class Updater {
  constructor(space, contentfulHost, indexer) {
    this.indexer = indexer
    const server = tunnel.createServer({
      spaces: [space],
    })

    let constructiveActions
    let destructiveActions = [`archive`, `delete`]
    if (contentfulHost && contentfulHost.includes(`preview`)) {
      // we are using the preview API
      constructiveActions = [`create`, `save`, `unarchive`]
    } else {
      // we are using the regular API
      constructiveActions = [`publish`]
      destructiveActions.push(`unpublish`)
    }

    constructiveActions.forEach(action => {
      server.on(action, payload => {
        debug(`Received webhook for ${action} event from Contentful`)
        this.indexer.indexSingleEntry(payload)
      })
    })

    destructiveActions.forEach(action => {
      server.on(action, payload => {
        debug(`Received webhook for ${action} event from Contentful`)
        this.indexer.deleteSingleEntry(payload)
      })
    })

    server.listen()
    console.log(`webhook server listening on port x`)
  }
}
