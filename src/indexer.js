const createIndexConfig = contentTypes => {
  const config = {
    settings: settings,
  }
  config.mappings = generateIndexMapping(contentTypes)
  return config
}

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

module.exports = {
  createIndexConfig,
}
