exports.createIndexConfig = contentTypes => {
  const config = {
    settings: settings,
  }
  config.mappings = generateIndexMapping(contentTypes)
  return config
}

exports.generateQuery = contentTypes => {
  let fields = [`title`, `title.partial`]
  Object.keys(contentTypes).forEach(ctName => {
    const contentType = contentTypes[ctName]
    Object.keys(contentType.fields).forEach(fieldName => {
      const type = contentType.fields[fieldName].type
      if (type === `Symbol`) {
        //short text field
        shortTextFieldQuery(fieldName).forEach(field => {
          fields.push(field)
        })
      } else if (type === `Text`) {
        // long text field
        longTextFieldQuery(fieldName).forEach(field => {
          fields.push(field)
        })
      }
    })
  })
  const query = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              type: `best_fields`,
              fields,
            },
          },
        ],
      },
    },
  }
  return query
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
const shortTextFieldQuery = fieldName => [fieldName, `${fieldName}.partial`]

// TODO: use relevant analyzer for other locales
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
const longTextFieldQuery = fieldName => [
  fieldName,
  `${fieldName}.partial`,
  `${fieldName}.english`,
]
