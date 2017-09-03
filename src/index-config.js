// Generate the elasticsearch index configuration
exports.createIndexConfig = (contentTypes, locale) => {
  const config = {
    settings: analyzers,
  }
  config.mappings = generateIndexMapping(contentTypes, locale)
  return config
}

// Generate the index field mapping for the content types in this space
// e.g. choose the analyser for short and long text fields
const generateIndexMapping = (contentTypes, locale) => {
  const mapping = {}
  Object.keys(contentTypes).forEach(ctName => {
    mapping[ctName] = {
      properties: {
        id: { type: `keyword` },
        title: shortTextField(),
      },
    }
    const contentType = contentTypes[ctName]
    Object.keys(contentType.fields).forEach(fieldName => {
      const fieldType = contentType.fields[fieldName].type
      if (fieldName === contentType.title) {
        // don't add the field
      } else if (fieldType === `Text`) {
        mapping[ctName][`properties`][fieldName] = longTextField(locale)
      } else if (fieldType === `Symbol`) {
        mapping[ctName][`properties`][fieldName] = shortTextField()
      }
    })
  })
  return mapping
}

// Generate the elasticsearch query
exports.generateQuery = contentTypes => {
  let fields = [`title`, `title.partial`]
  let highlightedFields = {}
  highlightShortTextField(highlightedFields, `title`)
  Object.keys(contentTypes).forEach(ctName => {
    const contentType = contentTypes[ctName]
    Object.keys(contentType.fields).forEach(fieldName => {
      const type = contentType.fields[fieldName].type
      if (fieldName === contentType.title) {
        // don't add the field
      } else if (type === `Symbol`) {
        //short text field
        shortTextFieldQueryFields(fieldName).forEach(field => {
          fields.push(field)
        })
        highlightShortTextField(highlightedFields, fieldName)
      } else if (type === `Text`) {
        // long text field
        longTextFieldQueryFields(fieldName).forEach(field => {
          fields.push(field)
        })
        highlightLongTextField(highlightedFields, fieldName)
      }
    })
  })
  const query = {
    highlight: {
      order: `score`,
      pre_tags: [`<strong>`],
      post_tags: [`</strong>`],
      fields: highlightedFields,
    },
    query: {
      multi_match: {
        type: `best_fields`,
        fields,
      },
    },
  }
  return query
}

const shortTextField = () => {
  return {
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
}
const shortTextFieldQueryFields = fieldName => [
  fieldName,
  `${fieldName}.partial`,
]
const highlightShortTextField = (highlightedFields, fieldName) => {
  highlightedFields[fieldName] = { number_of_fragments: 0 }
  highlightedFields[`${fieldName}.partial`] = { number_of_fragments: 0 }
}

const longTextField = locale => {
  return {
    type: `text`,
    term_vector: `with_positions_offsets`,
    fields: {
      partial: {
        type: `text`,
        analyzer: `partial_word`,
        search_analyzer: `simple`,
        term_vector: `with_positions_offsets`,
      },
      localised: {
        term_vector: `with_positions_offsets`,
        type: `text`,
        analyzer: localeToAnalyzer(locale),
      },
    },
  }
}
const longTextFieldQueryFields = fieldName => [
  fieldName,
  `${fieldName}.partial`,
  `${fieldName}.localised`,
]
const highlightLongTextField = (highlightedFields, fieldName) => {
  highlightedFields[fieldName] = {
    number_of_fragments: 3,
    type: `fvh`,
    matched_fields: [`${fieldName}.localised`, `${fieldName}.partial`],
  }
}

// convert a locale code from contentful into the analyzer name we need to use in elasticsearch
const localeToAnalyzer = localeCode => {
  const localeCodePrefix = localeCode.split(`-`)[0]
  const map = {
    en: `english`,
    es: `spanish`,
    fr: `french`,
    de: `german`,
  }
  const analyzer = map[localeCode] || map[localeCodePrefix]
  return analyzer
}

const analyzers = {
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
