const ContentfulSyncRedis = require(`contentful-sync-redis`)
const ElasticsearchClient = require(`./elasticsearch-client`)
const transform = require(`./transform`)
const index = require(`./indexer`)

const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

module.exports = class ContentfulTextSearch {
  constructor(args) {
    const { space, token, contentfulHost, redisHost } = args
    this.contentful = new ContentfulSyncRedis({
      space,
      token,
      contentfulHost,
      redisHost,
    })
    this.elasticsearch = new ElasticsearchClient({
      host: args.elasticHost,
      user: args.elasticUser,
      password: args.elasticPassword,
      logLevel: args.elasticLogLevel,
    })
  }

  // call this manually or e.g. via cron
  async main() {
    try {
      // retrieve from contentful
      const rawEntries = await this.contentful.getEntries()
      const resolvedEntries = await this.contentful.resolveReferences(
        rawEntries
      )
      const {
        items: contentTypesResponse,
      } = await this.contentful.client.getContentTypes()

      // transform ready for indexing
      const reducedEntries = transform.reduceEntries(resolvedEntries)
      const contentTypes = transform.reduceContentTypes(contentTypesResponse)
      const entries = transform.mapEntriesToES(
        reducedEntries,
        `en-US`,
        contentTypes
      )
      log(entries)

      // generate index mapping
      const indexMapping = index.createIndexConfig(contentTypes)
      log(indexMapping)
      // next: upload to ES via .bulk

      // todo for each locale put into a different index
    } catch (err) {
      console.log(err)
    }
  }
}
