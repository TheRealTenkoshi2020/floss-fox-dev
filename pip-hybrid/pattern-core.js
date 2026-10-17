/* Floss Fox Pattern Import: deterministic, review-first legend/text parser.
   Source text and files stay in the browser. No chart-grid stitch inference.
   Node/commonJS and browser UMD. No project writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FlossFoxPatternCore=api})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const MAX_TEXT=240000, MAX_LINES=12000, MAX_COLORS=600;
function normalCode(v){return String(v||'').trim().toUpperCase().replace(/^DMC\s*[:#-]?\s*/,'').replace(/\s+/g,'');}
function validCode(raw,validCodes){const code=normalCode(raw);return Object.prototype.hasOwnProperty.call(validCodes||{},code)?code:null;}
const isSku=v=>/^(?:\d{1,4}|BLANC|WHITE|ECRU|B5200)$/i.test(v);
function parseRow(line,validCodes,page){
 const clean=String(line||'').trim().replace(/[\u00a0\t]+/g,' ');
 if(clean.length<3||clean.length>300)return null;
 // Prevent false-positive DMC colors from chart dimensions (e.g. 180 x 240 stitches).
 if(/^\d{1,4}\s*(?:x|×|by)\s*\d{1,4}\s*(?:stitches?|crosses?)/i.test(clean))return null;
 // Strong preference: explicit DMC; standalone number only at start of a legend row.
 const match=/\bDMC\s*[:#-]?\s*(BLANC|WHITE|ECRU|B5200|\d{1,4})\b/i.exec(clean)||/^(?:\s*\|\s*)?(BLANC|WHITE|ECRU|B5200|\d{1,4})\b(?=\s|\||:|;|-)/i.exec(clean);
 if(!match||!isSku(match[1]))return null;
 const code=validCode(match[1],validCodes);if(!code)return null;
 // Only explicitly named units are imported. In particular 1200 stitches != 1200 skeins.
 const sk=/\b(\d{1,3})\s*(?:full\s+)?skeins?\b/i.exec(clean)||/\b(?:skeins?\s*[:=]\s*)(\d{1,3})\b/i.exec(clean);
 const st=/\b(\d{1,8})\s*(?:full\s+)?(?:cross\s*)?stitches\b/i.exec(clean)||/\b(?:stitches\s*[:=]\s*)(\d{1,8})\b/i.exec(clean);
 const strands=/\b([1-6])\s*strands?\b/i.exec(clean);
 const warnings=[];const qty=sk?+sk[1]:null, stitchCount=st?+st[1]:null;
 if(qty!==null&&(qty<1||qty>9999))warnings.push('invalid-skein-amount');
 if(stitchCount!==null&&(stitchCount<1||stitchCount>10000000))warnings.push('invalid-stitch-count');
 if(!sk&&!st)warnings.push('no-quantity-evidence');
 if(/\banchor\b/i.test(clean))warnings.push('check-thread-brand');
 if(/\b(?:backstitch|half\s*cross|blend|fractional)\b/i.test(clean))warnings.push('specialty-stitch-review');
 return {code,qty:warnings.includes('invalid-skein-amount')?null:qty,stitchCount:warnings.includes('invalid-stitch-count')?null:stitchCount,strandCount:strands?+strands[1]:null,sourcePage:page||1,sourceLine:clean.slice(0,300),warnings,needsReview:true};
}
function parsePages(pages,validCodes){
 if(!Array.isArray(pages)||pages.length>100)throw new Error('Invalid page list');
 let checked=0;const raw=[];const warnings=[];
 for(const p of pages){let text=String(p.text||'');if(text.length>MAX_TEXT)text=text.slice(0,MAX_TEXT);
  const lines=text.split(/\r?\n/);for(const line of lines){if(++checked>MAX_LINES){warnings.push('text-limit-reached');break}const row=parseRow(line,validCodes,p.page);if(row){raw.push(row);if(raw.length>=MAX_COLORS){warnings.push('color-limit-reached');break}}}
  if(checked>MAX_LINES||raw.length>=MAX_COLORS)break;
 }
 const byCode=new Map();for(const x of raw){const r=byCode.get(x.code);if(r){r.duplicates.push({page:x.sourcePage,line:x.sourceLine});r.warnings.push('duplicate-color-rows');r.needsReview=true; // Do not sum duplicate stitch counts across page legends
  r.qty=null;r.stitchCount=null;
 }else byCode.set(x.code,{...x,duplicates:[]})}
 return {version:1,rows:[...byCode.values()],warnings:[...new Set(warnings)],metadata:{sourcePages:pages.length,matchedLines:raw.length},trustedForAutomaticImport:false};
}
function validateModelRows(model,validCodes){
 if(!model||typeof model!=='object'||!Array.isArray(model.rows)||model.rows.length>MAX_COLORS)return {rows:[],warnings:['invalid-model-output']};
 const rows=[],seen=new Set(),warnings=[];
 for(const x of model.rows){if(!x||typeof x!=='object'){warnings.push('invalid-entry');continue}
  const code=validCode(x.code,validCodes);if(!code){warnings.push('unknown-color');continue}
  if(seen.has(code)){warnings.push('duplicate-color');continue}seen.add(code);
  const qty=Number.isInteger(x.skeins)&&x.skeins>=1&&x.skeins<=999?x.skeins:null;
  const stitchCount=Number.isInteger(x.stitches)&&x.stitches>0&&x.stitches<=1e7?x.stitches:null;
  // Never accept provider confidence scores as verified evidence.
  rows.push({code,qty,stitchCount,strandCount:Number.isInteger(x.strands)&&x.strands>=1&&x.strands<=6?x.strands:null,sourcePage:1,sourceLine:String(x.evidence||'').slice(0,220),warnings:['ai-proposed-not-verified'],needsReview:true,duplicates:[]});
 }
 return {rows,warnings};
}
function projectDraft(rows,name){
 if(!Array.isArray(rows)||rows.length<1||rows.length>MAX_COLORS)throw new Error('No colors to import');
 const items=[],seen=new Set();
 for(const row of rows){if(!row||!row.confirmed||!isSku(row.code)||seen.has(row.code))throw new Error('Review each color before importing');seen.add(row.code);
  const qty=row.qty==null?null:Number(row.qty),stitchCount=row.stitchCount==null?null:Number(row.stitchCount);
  if(qty!==null&&(!Number.isInteger(qty)||qty<1||qty>9999))throw new Error('Invalid skeins');
  if(stitchCount!==null&&(!Number.isInteger(stitchCount)||stitchCount<0||stitchCount>1e7))throw new Error('Invalid stitch count');
  items.push({code:row.code,qty,stated:qty!==null,assumed:0,src:[`Reviewed pattern legend: ${String(row.sourceLine||row.code).slice(0,140)}`],stitchCount,stitchCountReviewed:stitchCount!==null,...(Number.isInteger(row.strandCount)?{strandCount:row.strandCount}:{})});
 }
 const now=new Date().toISOString();return{id:(globalThis.crypto?.randomUUID?.()||'pattern-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)),name:String(name||'Imported pattern').trim().slice(0,100)||'Imported pattern',notes:'Imported from a user-reviewed pattern legend. Chart symbols and stitch-grid accuracy have NOT been verified.',buyBrand:'dmc',status:'planning',items,decisions:{},purchased:{},created:now,updated:now};
}
return {normalCode,validCode,parseRow,parsePages,validateModelRows,projectDraft};
});
