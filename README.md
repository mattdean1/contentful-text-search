# contentful-text-search

>    Powerful, configurable, and extensible text search for your content.

#### What does this package do?

-   Create a copy of your content **optimised for full-text search**


-   Store this in Elasticsearch, and **automatically keep it up to date**
-   **Generate a query** with out-of-the-box support for:
    -   Partial word matching
    -   Natural Language queries
    -   Result highlighting

#### Why wouldn't I use the Contentful Search API?

Contentful's search is good, but not optimised for text content. You might want to consider Elasticsearch over the built-in search when:

-   You have a lot of content and it is important for users to find the right piece (increasing precision of search results)
-   You want to customise the relevance scoring of search results (e.g. ranking popular content higher)
-   Your users often search using natural language or partial words, for example e.g. a user searching for 'force' would get back results for 'Salesforce' using this package)



# What is happening?

### 1. Retrieve

>   Get our content from Contentful

Use the Contentful Sync API to keep a local copy of our content in Redis - because we need all/most of our content for indexing, Redis should be faster than the Content Delivery API.


### 2. Transform

>   Transform Contentful data ready for indexing, then store it in Redis in batches.

Here we remap Contentful fields (e.g. dereferencing, de-localising, and stripping out extraneous info), and reformat some data, for example converting markdown to plain text.

##### Default transformations:

-   Contentful entry title is always mapped to a field called 'title' (unless there is a field named 'title')
-   Long text fields have their formatting stripped in case they are markdown.([https://github.com/etler/marked-plaintext](https://github.com/etler/marked-plaintext))


### 3. Index

>   Get our batches of transformed data from Redis and upload them to Elasticsearch via the bulk endpoint.

At this step the transformed data is passed through our analysis chain.

##### Default field analysis:

-   Long and short text fields are indexed as-is, and after going through a partial analyser
-   Long text fields are also put through an english analyser


### 4. Query

>   Search our Elasticsearch index!

#### Main query

Send a string and get back search results as JSON ordered by relevance

##### Default query:

-   Cross-fields multi-match on all fields

#### Highlighting

Also get back highlighted text snippets with your search results, showing where your query appears in results.

##### Default highlighting:

-   FVH for speed on partial and english long text
-   Regular on partial short text

TODO: Explore Universal highlighter in latest versions of ES


### 5. Keep up to date

We re-index all our content regularly via a cron job, and keep the index up to date via Contentful webhooks in between.

##### Default updates:

-   Cron job runs every 60 mins
-   Webhooks trigger an update when an entry is published, unpublished, or deleted


# Setup

###  Environment variables

| Name                | Value                       | Default                |
| ------------------- | --------------------------- | ---------------------- |
| CF_SPACE_ID         | Contentful space ID         |                        |
| CF_ACCESS_TOKEN     | Contentful access token     |                        |
| CF_WEBHOOK_USERNAME | Contentful webhook username |                        |
| CF_WEBHOOK_PASSWORD | Contentful webhook password |                        |
|                     |                             |                        |
| ES_URL              | Elasticsearch URL           | http://localhost:9200  |
| ES_USERNAME         | Elasticsearch username      | elastic                |
| ES_PASSWORD         | Elasticsearch password      | `none`                 |
|                     |                             |                        |
| REDIS_URL           | Redis URL                   | redis://localhost:6379 |
|                     |                             |                        |
| DEBUG               | See the [debug module](https://www.npmjs.com/package/debug) |                |



### Optional configuration

-   Exclude content types and fields from being indexed


-   Change which field maps to `title` in Elasticsearch (the entry title by default)


-   Specify the transformation and analyser for each field



-   Exclude fields from query
-   Boost fields in query



### Optional extensibility

-   Create a new transformation e.g. markdownToPlainText()
-   Create a new analyser e.g. edge-ngram for instant search





# Release map

### MVP - 1.0

-   Retrieve, Transform, Index, and Query with default settings
-   Keep index up to date with cron and webhooks

### 1.1

-   Add configuration options and extensibility as detailed in the Setup section

### 1.2

-   Add autocomplete feature
-   Add popularity feature
