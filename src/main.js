const debug = require(`debug`)(`contentful-text-search`)
const ContentfulSyncRedis = require(`contentful-sync-redis`)
const ElasticsearchClient = require(`./elasticsearch-client`)
const transform = require(`./transform`)
const indexer = require(`./indexer`)

// TODO: add support for fallback locale codes
// NOTE: should we use space name instead of ID when creating index name?
const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

module.exports = class ContentfulTextSearch {
  constructor(args) {
    const { space, token, contentfulHost, redisHost } = args
    this.space = space
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

  // Retrieve data from contentful
  async getAndTransformData() {
    try {
      const rawEntries = await this.contentful.getEntries()
      const resolvedEntries = await this.contentful.resolveReferences(
        rawEntries
      )
      const contentTypesResponse = await this.contentful.client.getContentTypes()
      const { locales } = await this.contentful.client.getSpace()
      const contentTypes = transform.reduceContentTypes(
        contentTypesResponse.items
      )
      const entries = transform.reformatEntries(
        resolvedEntries,
        contentTypes,
        locales
      )

      return { entries, locales, contentTypes }
    } catch (err) {
      console.log(err)
    }
  }

  indexContent(entries, locale, index) {
    const payload = transform.generatePayload(entries, locale, index)
    return this.elasticsearch.client.bulk(payload)
  }

  // delete all indices related to a contentful space
  async deleteAllIndices() {
    // TODO: delete contentful_space_* in case a locale is no longer in that space
    const { locales } = await this.contentful.client.getSpace()
    const deleteIndices = locales.map(async locale => {
      try {
        await this.elasticsearch.client.indices.delete({
          index: `contentful_${this.space}_${locale.code.toLowerCase()}`,
        })
      } catch (err) {
        // catch in case the index doesn't already exist
      }
    })
    await Promise.all(deleteIndices)
  }

  // delete and recreate all indices related to this contentful space
  async fullReindex() {
    try {
      const {
        entries,
        contentTypes,
        locales,
      } = await this.getAndTransformData()
      const indexConfig = indexer.createIndexConfig(contentTypes)
      // recreate an index for each locale and upload entries into it
      const recreateIndicesAndUploadEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        await this.elasticsearch.recreateIndex(index, indexConfig)
        await this.indexContent(entries, locale, index)
      })
      await Promise.all(recreateIndicesAndUploadEntries)
    } catch (err) {
      console.log(err)
    }
  }

  // clear all content from the indices then re-add it
  async reindexContent() {
    try {
      const { entries, locales } = await this.getAndTransformData()
      // upload entries into a different index for each locale
      const clearIndicesAndUploadEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        await this.elasticsearch.clearIndex(index)
        await this.indexContent(entries, locale, index)
      })
      await Promise.all(clearIndicesAndUploadEntries)
    } catch (err) {
      console.log(err)
    }
  }
}
