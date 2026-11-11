'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const S = require('../atelier/atelier-search-core');
const P = require('../atelier/atelier-preferences-core');
const V = require('../atelier/atelier-store-visit-core');
const C = require('../atelier/atelier-palette-core');
let n = 0;
const test = (name, fn) => { try { fn(); n++; console.log('PASS', name); } catch(e) { console.error('FAIL', name); throw e; } };
const index = S.build({
  projects: [{id:'p1', name:'Foxes in Snow', status:'progress', items:[{code:'310'},{code:'BLANC'}]}, {id:'demo',name:'Demo only',demo:true,items:[]}],
  threads: {threads:{'310':{n:2,partial:true,storage:{container:'Box 2',slot:'Row B'}},'BLANC':{n:1},'WHITE':{n:0}}},
  colors:[{brand:'DMC',code:'BLANC',name:'White'}, {brand:'DMC',code:'WHITE',name:'White'}, {brand:'DMC',code:'310',name:'Black'}, {brand:'Anchor',code:'403',name:'Black'}]
});
test('search: project by name', ()=> assert.equal(S.search(index,'snow').projects[0].key,'p1'));
test('search: project palette code', ()=> assert.equal(S.search(index,'BLANC').projects[0].key,'p1'));
test('search: storage location', ()=> assert.equal(S.search(index,'Box 2').threads[0].key,'DMC:310'));
test('search: BLANC kept distinct', ()=> assert.equal(S.search(index,'BLANC').colors[0].key,'DMC:BLANC'));
test('search: WHITE kept distinct', ()=> assert.equal(S.search(index,'WHITE').colors[0].key,'DMC:WHITE'));
test('search: demo project excluded', ()=> assert.equal(S.search(index,'Demo').projects.length,0));
test('search: empty string safe', ()=> assert.equal(S.search(index,'').total,0));
test('search: no query exfiltration or mutation', ()=>{const data = JSON.stringify(index);S.search(index,'DMC 310');assert.equal(JSON.stringify(index),data)});
test('search: bounded grouped output', ()=> {const x=S.search(index,'White',{limit:1});assert.equal(x.colors.length,1);assert(x.total>=2)});
test('preferences: default', ()=> assert.equal(P.normalize(null).data.theme,'system'));
test('preferences: future schema fails closed', ()=> assert.equal(P.normalize({v:3}).reason,'future-schema'));
test('preferences: malformed controls sanitized', ()=>{const v=P.normalize({theme:'evil',lastTab:'admin',lastProjectId:'x'.repeat(200),lowStockThreshold:-999});assert.equal(v.data.theme,'system');assert.equal(v.data.lastProjectId,null);assert.equal(v.data.lowStockThreshold,1)});
test('preferences: preview namespace isolated',()=> assert.notEqual(P.key(true),P.key(false)));
test('preferences: conversion deduped and bounded',()=> {let p=P.normalize(null).data;for(let i=0;i<15;i++)p=P.rememberConversion(p,{from:'DMC',to:'ANCHOR',code:String(i)}).data;assert.equal(p.recentConversions.length,12);p=P.rememberConversion(p,{from:'DMC',to:'ANCHOR',code:'14'}).data;assert.equal(p.recentConversions.length,12);assert.equal(p.recentConversions[0].code,'14')});
test('preferences: forbidden conversion rejected',()=>assert.equal(P.rememberConversion({}, {from:'DMC',to:'ANCHOR',code:'../../bad'}).ok,false));
const storage = new Map(), ls={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v)};
test('preferences: verified write/read', ()=>{assert(P.save(ls,P.key(),{theme:'forest',lastTab:'projects'}).ok);assert.equal(P.load(ls,P.key()).data.theme,'forest')});
test('preferences: blocked write does not masquerade as saved',()=>assert.equal(P.save({setItem(){throw new Error('quota')}},'x',{}).ok,false));
test('preferences: unrelated collection key untouched',()=>{ls.setItem('flossfox.threads.v1','untouched');P.save(ls,P.key(),{});assert.equal(ls.getItem('flossfox.threads.v1'),'untouched')});
const lines=[{key:'a',brand:'DMC',code:'310',quantity:2,bought:false},{key:'b',brand:'DMC',code:'BLANC',quantity:1,bought:false},{key:'c',brand:'DMC',code:'WHITE',quantity:1,bought:true}];
const links=[{merchantId:'michaels',merchantName:'Michaels',brand:'DMC',code:'310',verified:true},{merchantId:'hobby',merchantName:'Hobby Lobby',brand:'DMC',code:'310',verified:true},{merchantId:'michaels',merchantName:'Michaels',brand:'DMC',code:'BLANC',verified:false}];
test('store: one canonical checkbox per item despite multiple stores',()=>{const v=V.build(lines,links,{view:'by-store'});assert.equal(v.groups.reduce((x,g)=>x+g.items.length,0),3);assert.equal(v.counts.total,3)});
test('store: unverified merchant ignored',()=>{const v=V.build(lines,links,{view:'by-store'});assert(v.groups.some(x=>x.key==='unassigned'&&x.items.some(y=>y.code==='BLANC')))});
test('store: selected merchant retains unlinked under Other',()=>{const v=V.build(lines,links,{view:'by-store',selectedMerchant:'hobby'});assert(v.groups.some(x=>x.key==='unassigned'&&x.items.length===2))});
test('store: bought filter correct',()=>{const v=V.build(lines,links,{filter:'purchased'});assert.equal(v.groups[0].items[0].code,'WHITE')});
test('store: remaining filter correct',()=>{const v=V.build(lines,links,{filter:'remaining'});assert.equal(v.counts.visible,2)});
test('store: duplicate key rejected',()=>assert.throws(()=>V.build([lines[0],lines[0]]),/unique/));
test('store: read-only',()=>{const before=JSON.stringify(lines);V.build(lines,links);assert.equal(JSON.stringify(lines),before)});
test('store: share text contains only buy-needed canonical items',()=>{const t=V.shareText(lines);assert(t.includes('DMC BLANC'));assert(!t.includes('DMC WHITE'));assert.equal(t.split('DMC 310').length-1,1)});
test('palette: specials distinct',()=>{const v=C.strip([{code:'BLANC'},{code:'WHITE'},{code:'B5200'}]);assert.equal(v.total,3)});
test('palette: invalid rgb fallback',()=>assert.equal(C.strip([{code:'310'}],{'310':'javascript:alert(1)'}).swatches[0].rgb,null));
test('palette: deterministic six color sample and overflow',()=>{const colors=Array.from({length:20},(_,i)=>({code:String(i+100)}));const a=C.strip(colors);assert.equal(a.swatches.length,6);assert.equal(a.remaining,14);assert.deepEqual(a,C.strip(colors))});
test('palette: input untouched',()=>{const arr=[{code:'310'}];C.strip(arr);assert.equal(arr[0].code,'310')});
console.log(`\n${n} Atelier reference tests passed`);
