exports.rawContentTypes = [
  {
    sys: {
      space: {
        sys: {
          type: `Link`,
          linkType: `Space`,
          id: `bddk9mu5quk7`,
        },
      },
      id: `page`,
      type: `ContentType`,
      createdAt: `2017-08-15T10:24:03.883Z`,
      updatedAt: `2017-08-28T22:25:55.307Z`,
      revision: 7,
    },
    displayField: `title`,
    name: `Page`,
    description: ``,
    fields: [
      {
        id: `title`,
        name: `Title`,
        type: `Symbol`,
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: `summary`,
        name: `Summary`,
        type: `Text`,
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: `slug`,
        name: `Slug`,
        type: `Symbol`,
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: `sections`,
        name: `Sections`,
        type: `Array`,
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        items: {
          type: `Link`,
          validations: [
            {
              linkContentType: [`section`],
            },
          ],
          linkType: `Entry`,
        },
      },
    ],
  },
  {
    sys: {
      space: {
        sys: {
          type: `Link`,
          linkType: `Space`,
          id: `bddk9mu5quk7`,
        },
      },
      id: `section`,
      type: `ContentType`,
      createdAt: `2017-08-15T10:25:16.707Z`,
      updatedAt: `2017-09-02T12:18:59.963Z`,
      revision: 7,
    },
    displayField: `title`,
    name: `Section`,
    description: ``,
    fields: [
      {
        id: `title`,
        name: `Title`,
        type: `Symbol`,
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: `content`,
        name: `Content`,
        type: `Text`,
        localized: true,
        required: false,
        disabled: false,
        omitted: false,
      },
    ],
  },
]

exports.reducedContentTypes = {
  page: {
    title: `title`,
    fields: {
      title: {
        type: `Symbol`,
      },
      summary: {
        type: `Text`,
      },
      slug: {
        type: `Symbol`,
      },
      sections: {
        type: `Array`,
      },
    },
  },
  section: {
    title: `title`,
    fields: {
      title: {
        type: `Symbol`,
      },
      content: {
        type: `Text`,
      },
    },
  },
}

exports.rawEntry = {
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

exports.formattedEntry = {
  id: `S9n6QORFyEeKEUaGS2Ym4`,
  type: `section`,
  "en-US": {
    title: `Introduction`,
    content: `\nHi this is the search accelerator\n`,
  },
  "de-DE": {
    title: `test`,
    content: `\ntest2\n`,
  },
}

exports.locales = [
  {
    code: `en-US`,
    default: true,
    name: `U.S. English`,
    fallbackCode: null,
  },
  {
    code: `de-DE`,
    default: false,
    name: `German (Germany)`,
    fallbackCode: null,
  },
]
