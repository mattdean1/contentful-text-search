const assert = require(`assert`) // node.js core module

const transform = require(`../src/transform`)

const testData = require(`./test-data`)

describe(`Package`, () => {
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
