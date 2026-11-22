import type { CollectionSchema } from 'deepspace/schema'
const permissions = {
  viewer: { read: true, create: false, update: false, delete: false },
  member: { read: true, create: true, update: false, delete: false },
  admin: { read: true, create: true, update: false, delete: false },
}
export const studioSchemas: CollectionSchema[] = [
  {
    name: 'studios',
    columns: [
      {
        name: 'title',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 100,
      },
      {
        name: 'brief',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 3000,
      },
      {
        name: 'style',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 3000,
      },
    ],
    permissions: {
      ...permissions,
      member: { ...permissions.member, delete: 'own' },
      admin: { ...permissions.admin, delete: 'own' },
    },
  },
  {
    name: 'drawing-batches',
    columns: [
      {
        name: 'roomId',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 100,
      },
      {
        name: 'label',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 120,
      },
      {
        name: 'operations',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 60000,
      },
    ],
    permissions,
  },
  {
    name: 'studio-messages',
    columns: [
      {
        name: 'roomId',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 100,
      },
      {
        name: 'body',
        storage: 'text',
        interpretation: 'plain',
        required: true,
        maxLength: 2000,
      },
    ],
    permissions,
  },
]
