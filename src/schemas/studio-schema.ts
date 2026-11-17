import type { CollectionSchema } from 'deepspace/schema'
const permissions = {
  viewer: {read:true,create:false,update:false,delete:false},
  member: {read:true,create:true,update:false,delete:false},
  admin: {read:true,create:true,update:false,delete:false},
}
export const studioSchemas: CollectionSchema[] = [
  {name:'studios',columns:[
    {name:'title',storage:'text',interpretation:'plain',required:true},
    {name:'brief',storage:'text',interpretation:'plain',required:true},
    {name:'style',storage:'text',interpretation:'plain',required:true},
  ],permissions},
  {name:'drawing-batches',columns:[
    {name:'roomId',storage:'text',interpretation:'plain',required:true},
    {name:'label',storage:'text',interpretation:'plain',required:true},
    {name:'operations',storage:'text',interpretation:'plain',required:true},
  ],permissions},
  {name:'studio-messages',columns:[
    {name:'roomId',storage:'text',interpretation:'plain',required:true},
    {name:'body',storage:'text',interpretation:'plain',required:true},
  ],permissions},
]
