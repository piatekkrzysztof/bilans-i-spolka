import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'xh2t6pff',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
})
