const debug = require(`debug`)(`contentful-text-search:indexer`)
const transform = require(`./transform`)
const config = require(`./index-config`)

const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

module.exports = class Indexer {
  constructor(space, contentfulClient, elasticsearchClient) {
    this.space = space
    this.contentful = contentfulClient
    this.elasticsearch = elasticsearchClient
    this.queryGeneratedSinceLastIndexChange = false
  }

  // delete and recreate all related indices, and reindex the content
  async fullReindex() {
    try {
      const {
        entries,
        contentTypes,
        locales,
      } = await this.getAndTransformData()
      // recreate an index for each locale and upload entries into it
      const recreateIndicesAndUploadEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        const indexConfig = config.createIndexConfig(contentTypes, locale)
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
        // catch in case the index doesn't exist
      }
    })
    await Promise.all(deleteIndices)
  }

  // Retrieve data from contentful
  async getAndTransformData() {
    try {
      const resolvedEntries = await this.contentful.getResolvedEntries()
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

  async indexContent(entries, locale, index) {
    try {
      const payload = transform.generatePayload(entries, locale, index)
      if (payload.body.length > 0) {
        await this.elasticsearch.client.bulk(payload)
      }
    } catch (err) {
      debug(`Could not index entries for ${locale}`)
    }
  }
}
