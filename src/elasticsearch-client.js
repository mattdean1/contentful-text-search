const elasticsearch = require(`elasticsearch`)

const conf = {
  host: process.env.ES_URL || `http://localhost:9200`,
  log: process.env.DEBUG === `true` ? `trace` : `info`,
}
if (process.env.ES_PASSWORD) {
  // Use authentication
  const username = process.env.ES_USERNAME || `elastic`
  conf.httpAuth = `${username}:${process.env.ES_PASSWORD}`
}

module.exports = new elasticsearch.Client(conf)
