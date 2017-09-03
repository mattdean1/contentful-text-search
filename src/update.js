const debug = require(`debug`)(`contentful-text-search:update`)
const webhookTunnel = require(`contentful-webhook-tunnel`)
const webhookListener = require(`contentful-webhook-listener`)

module.exports = class Update {
  constructor(space, contentfulHost, indexer) {
    this.space = space
    this.indexer = indexer

    this.destructiveActions = [`archive`, `delete`]
    if (contentfulHost && contentfulHost.includes(`preview`)) {
      // we are using the preview API
      this.constructiveActions = [`create`, `save`, `unarchive`]
    } else {
      // we are using the regular API
      this.constructiveActions = [`publish`]
      this.destructiveActions.push(`unpublish`)
    }
  }

  createServer(opts, requestListener) {
    let server
    if (process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN) {
      debug(`Local development or behind proxy, setting up webhook tunnel`)
      server = webhookTunnel.createServer(
        {
          spaces: [this.space],
        },
        requestListener
      )
    } else {
      debug(`Setting up webhook listener`)
      server = webhookListener.createServer(opts, requestListener)
    }

    this.constructiveActions.forEach(action => {
      debug(`Setting up webhook for constructive action ${action}`)
      server.on(action, payload => {
        debug(`Received webhook for ${action} event from Contentful`)
        this.indexer.indexSingleEntry(payload)
      })
    })

    this.destructiveActions.forEach(action => {
      debug(`Setting up webhook for destructive action ${action}`)
      server.on(action, payload => {
        debug(`Received webhook for ${action} event from Contentful`)
        this.indexer.deleteSingleEntry(payload)
      })
    })

    this.server = server
    return server
  }
}
