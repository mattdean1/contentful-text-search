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

  async retrieve() {
    // retrieve from contentful
    const rawEntries = await this.contentful.getEntries()
    const resolvedEntries = await this.contentful.resolveReferences(rawEntries)
    const {
      items: contentTypesResponse,
    } = await this.contentful.client.getContentTypes()
    return { resolvedEntries, contentTypesResponse }
  }

  // call this manually or e.g. via cron
  // TODO: for each locale put into a different index
  async main() {
    try {
      const { resolvedEntries, contentTypesResponse } = await this.retrieve()
      const contentTypes = transform.reduceContentTypes(contentTypesResponse)
      const entries = transform.transform(
        resolvedEntries,
        `en-US`,
        contentTypes
      )

      // generate index mapping and create index
      const indexConfig = index.createIndexConfig(contentTypes)
      const indexName = `testindex`
      await this.elasticsearch.client.indices.delete({ index: indexName })
      await this.elasticsearch.client.indices.create({
        index: indexName,
        body: indexConfig,
      })

      // upload to ES via .bulk
      await this.elasticsearch.client.bulk(entries)
    } catch (err) {
      console.log(err)
    }
  }
}
