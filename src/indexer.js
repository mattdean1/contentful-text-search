const debug = require(`debug`)(`contentful-text-search:indexer`)
const transform = require(`./transform`)

module.exports = class Indexer {
  constructor(space, contentfulClient, elasticsearchClient) {
    this.space = space
    this.contentful = contentfulClient
    this.elasticsearch = elasticsearchClient
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
        // catch in case the index doesn't exist
      }
    })
    await Promise.all(deleteIndices)
  }

  // delete and recreate all related indices, and reindex the content
  async fullReindex() {
    try {
      const {
        entries,
        contentTypes,
        locales,
      } = await this.getAndTransformData()
      const indexConfig = createIndexConfig(contentTypes)
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

const createIndexConfig = contentTypes => {
  const config = {
    settings: settings,
  }
  config.mappings = generateIndexMapping(contentTypes)
  return config
}

// Generate the index field mapping for an array of content types
// e.g. choose the analyser for short and long text fields
const generateIndexMapping = contentTypes => {
  const mapping = {}
  Object.keys(contentTypes).forEach(ctName => {
    mapping[ctName] = {
      properties: {
        id: { type: `keyword` },
        title: shortTextField,
      },
    }
    const contentType = contentTypes[ctName]
    Object.keys(contentType.fields).forEach(fieldName => {
      const fieldType = contentType.fields[fieldName].type
      if (fieldName === contentType.title) {
        // don't add the field
      } else if (fieldType === `Text`) {
        // add long text
        mapping[ctName][`properties`][fieldName] = longTextField
      } else if (fieldType === `Symbol`) {
        // add short text
        mapping[ctName][`properties`][fieldName] = shortTextField
      }
    })
  })
  return mapping
}

const settings = {
  analysis: {
    tokenizer: {
      partial_word_tokenizer: {
        type: `ngram`,
        min_gram: 4,
        max_gram: 10,
        token_chars: [`letter`, `digit`, `punctuation`],
      },
    },
    analyzer: {
      partial_word: {
        type: `custom`,
        tokenizer: `partial_word_tokenizer`,
        filter: [`lowercase`],
      },
    },
  },
}

const shortTextField = {
  type: `text`,
  fields: {
    partial: {
      type: `text`,
      analyzer: `partial_word`,
      search_analyzer: `simple`,
      term_vector: `with_positions_offsets`,
    },
  },
}

const longTextField = {
  type: `text`,
  term_vector: `with_positions_offsets`,
  fields: {
    partial: {
      type: `text`,
      analyzer: `partial_word`,
      search_analyzer: `simple`,
      term_vector: `with_positions_offsets`,
    },
    english: {
      term_vector: `with_positions_offsets`,
      type: `text`,
      analyzer: `english`,
    },
  },
}
