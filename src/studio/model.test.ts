import { describe, it, expect } from 'vitest'
import { batchSchema, markSchema, replay, svg } from './model'
describe('drawing protocol', () => {
  it('replays replacements and deletion deterministically', () => {
    const mark = markSchema.parse({id:'fox',type:'rect',layer:2,fill:'#BA4B35'})
    const event = (recordId:string,createdAt:number,operations:unknown[]) => ({recordId,createdAt,data:{roomId:'room',label:'pass',operations:JSON.stringify(operations)}})
    const batches=[event('b',2,[{op:'delete',id:'fox'}]),event('a',1,[{op:'put',mark}])]
    expect(replay(batches,1)).toEqual([mark])
    expect(replay(batches)).toEqual([])
  })
  it('rejects markup, remote paint URLs, unbounded batches and nonfinite values', () => {
    for(const patch of [{fill:'url(https://evil)'},{d:'<script/>'},{onload:'alert(1)'},{x:Infinity}]) {
      expect(markSchema.safeParse({id:'x',type:'path',layer:1,...patch}).success).toBe(false)
    }
    expect(batchSchema.safeParse(Array(51).fill({op:'delete',id:'x'})).success).toBe(false)
  })
  it('escapes text and ignores malformed persisted events', () => {
    expect(svg([markSchema.parse({id:'x',type:'text',layer:1,text:'<script>&'})])).toContain('&lt;script&gt;&amp;')
    expect(replay([{recordId:'x',createdAt:1,data:{roomId:'r',label:'x',operations:'bad json'}}])).toEqual([])
  })
})
