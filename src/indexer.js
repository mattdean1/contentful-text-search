const debug = require(`debug`)(`contentful-text-search:indexer`)
const transform = require(`./transform`)
const config = require(`./index-config`)

module.exports = class Indexer {
  constructor(space, contentfulClient, elasticsearchClient) {
    this.space = space
    this.contentful = contentfulClient
    this.elasticsearch = elasticsearchClient
    this.queryGeneratedSinceLastIndexChange = false
  }

  /*
    Delete and recreate an index for each locale in the space, and index the content into these indices.
  */
  async fullReindex() {
    try {
      const { entries, contentTypes, locales } = await this.getFormattedData()
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
      debug(`Error in fullReindex: %s`, err)
      throw new Error(err)
    }
  }

  /*
    Clear the indices and reindex all the content from Contentful
  */
  async reindexContent() {
    try {
      const { entries, locales } = await this.getFormattedData()
      // upload entries into a different index for each locale
      const clearIndicesAndUploadEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        await this.elasticsearch.clearIndex(index)
        await this.indexContent(entries, locale, index)
      })
      await Promise.all(clearIndicesAndUploadEntries)
    } catch (err) {
      debug(`Error in reindexContent: %s`, err)
      throw new Error(err)
    }
  }

  /*
    Delete all indices related to a contentful space
  */
  async deleteAllIndices() {
    // TODO: delete contentful_space_* in case a locale is no longer in that space
    const { locales } = await this.contentful.client.getSpace()
    const deleteIndices = locales.map(async locale => {
      const index = `contentful_${this.space}_${locale.code.toLowerCase()}`
      try {
        await this.elasticsearch.client.indices.delete({
          index,
        })
      } catch (err) {
        // catch but don't throw in case the index doesn't exist
        debug(`Could not delete index %s`, index)
      }
    })
    await Promise.all(deleteIndices)
  }

  // Retrieve data from contentful and reformat it
  async getFormattedData(rawEntries) {
    try {
      let resolvedEntries
      if (rawEntries) {
        resolvedEntries = await this.contentful.resolveReferences(rawEntries)
      } else {
        resolvedEntries = await this.contentful.getResolvedEntries()
      }
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
      debug(`Error getting formatted data: %s`, err)
      throw new Error(err)
    }
  }

  // Upload entries into a given index
  async indexContent(entries, locale, index) {
    try {
      const payload = transform.generatePayload(entries, locale, index)
      if (payload.body.length > 0) {
        await this.elasticsearch.client.bulk(payload)
      }
    } catch (err) {
      // don't throw since we should continue indexing for other locales
      debug(`Could not index entries for ${locale}`)
    }
  }

  async indexSingleEntry(entry) {
    try {
      const { entries, locales } = await this.getFormattedData([entry])
      // index an entry for each locale
      const indexLocalisedEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        await this.indexContent(entries, locale, index)
      })
      await Promise.all(indexLocalisedEntries)
    } catch (err) {
      debug(`Error in indexSingleEntry: %s`, err)
      throw new Error(err)
    }
  }

  async deleteSingleEntry(entry) {
    try {
      const { locales } = await this.contentful.client.getSpace()
      // delete the entry for each locale
      const deleteLocalisedEntries = locales.map(async localeObj => {
        const locale = localeObj.code
        const index = `contentful_${this.space}_${locale.toLowerCase()}`
        try {
          await this.elasticsearch.client.delete({
            index,
            type: entry.sys.contentType.sys.id,
            id: entry.sys.id,
          })
        } catch (err) {
          // don't throw error because the entry may not exist
          debug(`Failed to delete entry for locale ${locale}`)
        }
      })
      await Promise.all(deleteLocalisedEntries)
    } catch (err) {
      debug(`Error in deleteSingleEntry: %s`, err)
      throw new Error(err)
    }
  }
}
