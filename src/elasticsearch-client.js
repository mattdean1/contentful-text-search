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

  // remove all the content in an index
  clearIndex(index) {
    return this.client.deleteByQuery({
      index,
      body: {
        query: {
          match_all: {},
        },
      },
    })
  }

  // delete and recreate an index
  async recreateIndex(name, indexConfig) {
    try {
      await this.client.indices.delete({ index: name })
    } catch (err) {
      // catch in case the index doesn't already exist
    }
    await this.client.indices.create({
      index: name,
      body: indexConfig,
    })
  }
}
