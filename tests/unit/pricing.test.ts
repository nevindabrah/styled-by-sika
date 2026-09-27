import { describe, expect, it } from 'vitest';
import { seedCatalog } from '../../lib/seed';
import { durationLabel, durationRange, money, quote } from '../../lib/pricing';
const service=(slug:string)=>seedCatalog.services.find(s=>s.slug===slug)!.id;
const extra=(slug:string)=>seedCatalog.extras.find(e=>e.slug===slug)!.id;
describe('service menu pricing',()=>{
 it('contains exactly the owner-supplied menu',()=>{
  expect(seedCatalog.services).toHaveLength(27);
  expect(seedCatalog.extras.map(e=>e.name)).toEqual(['Boho/Curl Add-On','Human Hair Curls','Blow-Dry','Take-Down','Extra Length','Extra Fullness']);
  expect(new Set(seedCatalog.services.map(s=>s.slug)).size).toBe(27);
 });
 it('formats Canadian prices and durations like the menu',()=>{
  expect(money(12000)).toBe('CA$120');
  expect(durationLabel(210)).toBe('3 hr 30 min');
  expect(durationLabel(120)).toBe('2 hr');
  const knots=seedCatalog.services.find(s=>s.slug==='medium-miracle-knots-shoulder')!;
  expect(durationRange(knots)).toBe('5–6 hr');
  expect(quote(seedCatalog,{service:knots.id,extras:[]}).duration).toBe(360);
  expect(durationRange(seedCatalog.services.find(s=>s.slug==='medium-miracle-knots-mid-back')!)).toBe('6 hr');
 });
 it('quotes fixed prices, ranges and open-ended extras',()=>{
  const id=service('large-knotless-shoulder');
  expect(quote(seedCatalog,{service:id,extras:[]}).estimate).toBe('CA$150');
  expect(quote(seedCatalog,{service:id,extras:[extra('blow-dry')]}).estimate).toBe('CA$175');
  expect(quote(seedCatalog,{service:id,extras:[extra('extra-length')]}).estimate).toBe('CA$170–CA$200');
  expect(quote(seedCatalog,{service:id,extras:[extra('take-down')]}).estimate).toBe('From CA$180');
  expect(quote(seedCatalog,{service:id,extras:[]}).duration).toBe(210);
 });
 it('rejects missing services and client-provided items',()=>{
  expect(()=>quote(seedCatalog,{service:'',extras:[]})).toThrow('Choose a service');
  expect(()=>quote(seedCatalog,{service:service('natural-hair-twists'),extras:[extra('human-hair-curls')]})).toThrow();
 });
});
