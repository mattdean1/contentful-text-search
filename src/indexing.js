const indexConfig = require(`./index-config`)

const createIndexConfig = contentTypes => {
  const config = {
    settings: indexConfig.settings,
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
        title: indexConfig.shortTextField,
      },
    }
    const contentType = contentTypes[ctName]
    Object.keys(contentType.fields).forEach(fieldName => {
      const fieldType = contentType.fields[fieldName].type
      if (fieldName === contentType.title) {
        // don't add the field
      } else if (fieldType === `Text`) {
        // add long text
        mapping[ctName][`properties`][fieldName] = indexConfig.longTextField
      } else if (fieldType === `Symbol`) {
        // add short text
        mapping[ctName][`properties`][fieldName] = indexConfig.shortTextField
      }
    })
  })
  return mapping
}

module.exports = {
  createIndexConfig,
}
