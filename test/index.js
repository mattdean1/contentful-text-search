const assert = require(`assert`) // node.js core module

const ContentfulTextSearch = require(`../`)
const transform = require(`../src/transform`)

const testData = require(`./test-data`)

describe(`Package`, () => {
  describe(`Public API`, () => {
    let instance

    beforeEach(() => {
      // Create a new class instance before every test.
      instance = new ContentfulTextSearch({
        space: `fakestring`,
        token: `fakestring`,
        elasticLogLevel: `error`,
      })
    })

    it(`should have a query method`, () => {
      assert.equal(typeof instance, `object`)
      assert.equal(typeof instance.query, `function`)
    })
    it(`should contain an indexer class`, () => {
      assert.equal(typeof instance, `object`)
      assert.equal(typeof instance.indexer, `object`)
    })

    describe(`Indexer`, () => {
      it(`should have a fullReindex method`, () => {
        assert.equal(typeof instance.indexer.fullReindex, `function`)
      })
      it(`should have a reindexContent method`, () => {
        assert.equal(typeof instance.indexer.reindexContent, `function`)
      })
      it(`should have a deleteAllIndices method`, () => {
        assert.equal(typeof instance.indexer.deleteAllIndices, `function`)
      })
      it(`should have a reindexContent method`, () => {
        assert.equal(typeof instance.indexer.reindexContent, `function`)
      })
    })
  })

  describe(`Transformations`, () => {
    it(`should reduce content types`, () => {
      assert.deepEqual(
        transform.reduceContentTypes(testData.rawContentTypes),
        testData.reducedContentTypes
      )
    })
    it(`should reformat entries`, () => {
      assert.deepEqual(
        transform.reformatEntries(
          [testData.rawEntry],
          testData.reducedContentTypes,
          testData.locales
        ),
        [testData.formattedEntry]
      )
    })
  })
})
