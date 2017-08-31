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
  settings,
  shortTextField,
  longTextField,
}
