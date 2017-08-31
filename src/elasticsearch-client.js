const elasticsearch = require(`elasticsearch`)

module.exports = class ElasticsearchClient {
  constructor({ host, user, password, logLevel }) {
    const conf = {
      host: host || `http://localhost:9200`,
      log: logLevel || `info`,
    }
    if (password) {
      // Use authentication
      const username = user || `elastic`
      conf.httpAuth = `${username}:${password}`
    }
    this.client = new elasticsearch.Client(conf)
  }
}
