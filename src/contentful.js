import { createClient } from "contentful"

const client = createClient({
  space: process.env.CF_SPACE_ID,
  accessToken: process.env.CF_ACCESS_TOKEN,
})

const sync = async () => {}
