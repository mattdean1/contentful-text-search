const assert = require(`assert`) // node.js core module

const transforms = require(`../src/transformations`)

describe(`Package`, () => {
  describe(`Transformations`, () => {
    it(`should remove useless info`, () => {
      const rawEntry = {
        sys: {
          space: {
            sys: {
              type: `Link`,
              linkType: `Space`,
              id: `bddk9mu5quk7`,
            },
          },
          id: `S9n6QORFyEeKEUaGS2Ym4`,
          type: `Entry`,
          createdAt: `2017-08-15T10:34:19.088Z`,
          updatedAt: `2017-08-30T16:58:04.556Z`,
          revision: 2,
          contentType: {
            sys: {
              type: `Link`,
              linkType: `ContentType`,
              id: `section`,
            },
          },
        },
        fields: {
          "en-US": {
            title: `Introduction`,
            content: `Hi this is the search accelerator`,
          },
          "de-DE": {
            title: `test`,
            content: `test2`,
          },
        },
      }
      const transformedEntry = {
        id: `S9n6QORFyEeKEUaGS2Ym4`,
        type: `section`,
        "en-US": {
          title: `Introduction`,
          content: `Hi this is the search accelerator`,
        },
        "de-DE": {
          title: `test`,
          content: `test2`,
        },
      }

      assert.deepEqual(transforms.removeUselessInfo([rawEntry]), [
        transformedEntry,
      ])
    })
  })
})
