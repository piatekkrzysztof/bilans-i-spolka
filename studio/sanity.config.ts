import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes, singletons } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'bilans-i-spolka',
  title: 'Bilans & Spółka',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'xh2t6pff',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Ustawienia strony to jeden dokument - nie da się ich przypadkiem zduplikować ani usunąć.
    templates: templates => templates.filter(({ schemaType }) => !singletons.includes(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletons.includes(schemaType) ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : actions,
  },
})
