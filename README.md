[![Build Status](https://travis-ci.org/mattdean1/contentful-text-search.svg?branch=master)](https://travis-ci.org/mattdean1/contentful-text-search)

# contentful-text-search

>    Powerful, configurable, and extensible text search for your content.

#### What does this package do?

-   Create a copy of your content **optimised for full-text search**


-   Store this in Elasticsearch, and **automatically keep it up to date**
-   **Generate a query** with out-of-the-box support for:
    -   Partial word matching
    -   Localised natural language queries
    -   Result highlighting

#### Why wouldn't I use the Contentful Search API?

Contentful's search is good, but not optimised for text content. You might want to consider Elasticsearch over the built-in search when:

-   You have a lot of content and it is important for users to find the right piece (increasing precision of search results)
-   You want to customise the relevance scoring of search results (e.g. ranking popular content higher)
-   Your users often search using natural language or partial words, for example a user searching for 'force' would get back results for 'Salesforce' using this package)

# Install

```
npm install --save contentful-text-search
```

# Usage

```javascript
const ContentfulTextSearch = require('contentful-text-search')
const search = new ContentfulTextSearch({ space: 'space_id', token: 'access_token' })
search.indexer.fullReindex()

// later
search.query('searchTerm', 'en-US')
```

# API

## Initialisation

Initialise the module using the `new` operator, passing in the mandatory values for:

 - Contentful space ID
 - Contentful access token

 Optionally, also pass in:

- Elasticsearch host - Default: `http://localhost:9200`
- Contentful API host - Default: `cdn.contentful.com`
- Redis URL - Default: `redis://localhost:6379`
- Elasticsearch username - Default: `elastic`
- Elasticsearch password - Default: none
- Elasticsearch [log level](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/logging.html#logging-customization) - Default: `info`

```javascript
const ContentfulTextSearch = require('contentful-text-search')
const search = new ContentfulTextSearch({
  space: 'string',
  token: 'string',
  elasticHost: 'optionalString',
  contentfulHost: 'optionalString',
  redisHost: 'optionalString',
  elasticUser: 'optionalString',
  elasticPassword: 'optionalString',
  elasticLogLevel: 'optionalString'
})
```

## Indexing

Although most of the indexing functions return a promise, you should be aware that Elasticsearch is ['near real-time'](https://www.elastic.co/guide/en/elasticsearch/guide/current/near-real-time.html), so you might have to [deal with a short delay](https://stackoverflow.com/questions/31499575/how-to-deal-with-elasticsearch-index-delay) before an indexed document is available in search results.

### Full Reindex

Delete and recreate an index for each locale in the space, and index the content into these indices. You need to call this the first time you use the module, but after that only when your content model changes.

```javascript
search.indexer.fullReindex() // returns a promise
```

### Reindex Content

Clear the indices and reindex all the content from Contentful. You can use this to update the indices if they are out of date, assuming the content model hasn't changed.

```javascript
search.indexer.reindexContent() // returns a promise
```

### Delete all indices

Deletes all indices related to this space. Could be used to clean up your Elasticsearch cluster after deleting a Contentful space.

```javascript
search.indexer.deleteAllIndices() // returns a promise
```

## Querying

### Main query

Queries the Elasticsearch index and get back search results as JSON ordered by relevance, with highlights showing where your search term appeared in the result. Both parameters are mandatory.

```javascript
search.query('searchTerm', 'localeCode') // returns a promise containing the results and highlights
```

##  Logging

See the [debug module](https://www.npmjs.com/package/debug). Use the package name (`contentful-text-search`) as the string in the environment variable.

# What is happening?

## 1. Retrieve - Get our content from Contentful

Use the Contentful Sync API to keep a local copy of our content in Redis - because we need all/most of our content for indexing, Redis should be faster than the Content Delivery API.


## 2. Transform - Transform Contentful data ready for indexing.

Here we remap Contentful fields (e.g. dereferencing, de-localising, and stripping out extraneous info), and reformat some data, for example converting markdown to plain text.

##### Default transformations:

-   Contentful entry title is always mapped to a field called 'title' (unless there is a field named 'title'). Don't use long text fields / fields with markdown as the title.
-   Long text fields have their formatting stripped in case they are markdown. (Using [marked-plaintext](https://github.com/etler/marked-plaintext))


## 3. Index - Upload our transformed data to Elasticsearch via the bulk endpoint.

At this step the transformed data is passed through our analysis chain.

The content for each locale from Contentful is uploaded to a separate index.

##### Default field analysis:

-   Long and short text fields are indexed as-is, and after going through a partial analyser
-   Long text fields are also put through a [local language analyser](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/analysis-lang-analyzer.html), i.e. `english` analyser for English content or `german` analyser for German content.


## 4. Query - Search our Elasticsearch index!

#### Main query

Send a string and get back search results as JSON ordered by relevance

##### Default query:

-   `best_fields` [multi-match](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-multi-match-query.html#type-best-fields) on all fields

#### Highlighting

Also get back highlighted text snippets with your search results, showing where your query appears in results.

##### Default highlighting:

-   FVH for speed on partial and localised long text
-   Regular on partial short text

TODO: Explore Universal highlighter in latest versions of ES


## 5. Update - Automatically keep the index up to date with the latest content.

We re-index all our content regularly via a cron job, and keep the index up to date via Contentful webhooks in between.

##### Default updates:

-   Cron job runs every 60 mins
-   Webhooks trigger an update when an entry is published, unpublished, or deleted








# Optional Extensibility and Configuration

### Configuration

-   Exclude content types and fields from being indexed
-   Specify the transformation and analyser for each field

-   Exclude fields from query
-   Boost fields in query

### Extensibility

-   Create a new transformation e.g. markdownToPlainText()
-   Create a new analyser e.g. edge-ngram for instant search





# Release map / Changelog

### MVP - 0.1

-   Localised indexing and querying generated from the content model

### 0.2

- Update index automatically

### 0.3

-   Add configuration options and extensibility as detailed in the Setup section
-   Add batching via Redis, to speed things up when there are many entries

### 0.4

-   Add autocomplete feature
-   Add popularity feature

### 1.0

- Support old versions of Node using webpack


# Contributions

All contributions welcome! Please feel free to open an issue/PR :smile:
