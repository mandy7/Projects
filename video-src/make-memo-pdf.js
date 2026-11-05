const { chromium } = require('playwright'); const fs=require('fs');
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
(async()=>{const b=await chromium.launch(); const p=await (await b.newContext()).newPage();
 await p.goto('file:///home/user/Projects/decision-memo/try-it-yourself.html'); await p.waitForTimeout(500);
 const d=await p.evaluate(()=>{const D=window.__demo,pl=D.plan('hotels','budget');return {memo:pl.memo,sum:pl.summary,rng:D.IND.hotels.budget.rng,routes:D.IND.hotels.budget.routes,plan:D.IND.hotels.budget.plan,co:D.IND.hotels.co};});
 const m=d.memo, S=d.sum;
 // memo blocks: first block is Recommendation (already in summary); render the rest
 let body='',open=false,skipRec=false;
 let skip=false;
 m.blocks.forEach((bl,i)=>{
   if(bl.t==='h'){skip=(bl.x==='Recommendation');}
   if(skip) return;
   if(bl.t!=='li'&&open){body+='</ul>';open=false;}
   if(bl.t==='h'){body+='<h3><i class="mk ana"></i>'+esc(bl.x)+'</h3>';}
   else if(bl.t==='p'){body+='<p>'+esc(bl.x)+'</p>';}
   else if(bl.t==='li'){if(!open){body+='<ul>';open=true;}body+='<li>'+esc(bl.x)+'</li>';}
 }); if(open) body+='</ul>';
 const f0=v=>Math.round(v);
 const rows=d.routes.map((r,i)=>{const g=k=>d.rng[i*3+k]; const fm=(a,pct)=>pct?`${Math.round(a[0]*100)}% / <b>${Math.round(a[1]*100)}%</b> / ${Math.round(a[2]*100)}%`:`${f0(a[0])} / <b>${f0(a[1])}</b> / ${f0(a[2])}`; const fb=a=>`${a[0].toFixed(2)} / <b>${a[1].toFixed(2)}</b> / ${a[2].toFixed(2)}`; return `<tr><td>${esc(r)}</td><td>${fm(g(0),false)}</td><td>${fm(g(1),true)}</td><td>${fb(g(2))}</td></tr>`;}).join('');
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>Sample decision memo | Second Analyst</title><style>
@font-face{font-family:Inter;font-weight:400;src:url(file:///home/user/Projects/decision-memo/assets/fonts/inter-latin-400-normal.woff2)}
@font-face{font-family:Inter;font-weight:500;src:url(file:///home/user/Projects/decision-memo/assets/fonts/inter-latin-500-normal.woff2)}
@font-face{font-family:Inter;font-weight:600;src:url(file:///home/user/Projects/decision-memo/assets/fonts/inter-latin-600-normal.woff2)}
@font-face{font-family:Inter;font-weight:700;src:url(file:///home/user/Projects/decision-memo/assets/fonts/inter-latin-700-normal.woff2)}
@page{size:A4;margin:18mm 18mm 16mm}
*{box-sizing:border-box}body{font-family:Inter,sans-serif;color:#172B3A;font-size:10.2pt;line-height:1.5;margin:0}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.2pt solid #172B3A;padding-bottom:6pt;font-size:9pt}
.top b{font-size:11pt;letter-spacing:-.01em}.top span{color:#697580}
.samp{margin:10pt 0 0;padding:7pt 10pt;background:#F6F0DC;border:.6pt solid #E6DBB4;font-size:8.6pt;color:#5a4a1e}
h1{font-size:19pt;line-height:1.2;letter-spacing:-.02em;margin:14pt 0 3pt;font-weight:600}
.meta{font-size:8.8pt;color:#697580;margin:0 0 10pt}
.leg{display:flex;gap:14pt;font-size:8.2pt;color:#697580;margin:0 0 12pt}
.mk{display:inline-block;width:6.5pt;height:6.5pt;margin-right:4pt;background:#172B3A}.mk.y{background:#c2561d}.mk.a{background:#fff;border:1pt solid #697580}.mk.ana{background:#557C78}
.lab{font-size:7.8pt;font-weight:600;color:#456862;text-transform:uppercase;letter-spacing:.04em;margin:0 0 2pt}
.rec{border-top:2.4pt solid #172B3A;border-left:.6pt solid #DCE1E4;border-right:.6pt solid #DCE1E4;border-bottom:.6pt solid #DCE1E4;padding:10pt 12pt;margin:0 0 8pt}
.rec .big{font-size:13.4pt;font-weight:600;line-height:1.3;letter-spacing:-.015em;margin:2pt 0 5pt}
.rec p{margin:0;color:#3A4B59}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-bottom:12pt}
.box{border:.6pt solid #DCE1E4;background:#E9EFEE;padding:8pt 10pt}.box p{margin:0;font-size:9.6pt;color:#3A4B59}
h2{font-size:11.5pt;margin:14pt 0 5pt;font-weight:600}
h3{font-size:10.4pt;margin:11pt 0 2pt;font-weight:600;break-after:avoid}p,li{orphans:3;widows:3}h3 .mk{margin-right:5pt}
p{margin:0 0 5pt}ul{margin:2pt 0 5pt;padding-left:13pt}li{margin-bottom:2pt}
table{border-collapse:collapse;width:100%;font-size:8.8pt}th{text-align:left;font-weight:600;color:#697580;font-size:7.8pt;border-bottom:.8pt solid #172B3A;padding:4pt 6pt 4pt 0}td{border-bottom:.5pt solid #DCE1E4;padding:5pt 6pt 5pt 0;vertical-align:top}
.note{font-size:8.2pt;color:#697580;margin:4pt 0 0}
.rev{margin-top:14pt;border:.6pt solid #DCE1E4;padding:8pt 10pt;font-size:9pt;background:#F7F7F4;color:#3A4B59}
.foot{margin-top:12pt;font-size:7.8pt;color:#697580;border-top:.5pt solid #DCE1E4;padding-top:6pt}
</style></head><body>
<div class="top"><b>Second Analyst</b><span>Sample decision memo</span></div>
<div class="samp"><b>Sample only.</b> Every input is illustrative, for a hypothetical company. Nothing here describes a real business, client or result.</div>
<h1>${esc(m.title)}</h1><p class="meta">${esc(m.meta)}</p>
<div class="leg"><span><i class="mk"></i>Public source</span><span><i class="mk y"></i>Customer-provided information</span><span><i class="mk a"></i>Assumption</span><span><i class="mk ana"></i>Analysis or interpretation</span></div>
<div class="rec"><div class="lab"><i class="mk ana"></i>Recommendation</div><div class="big">${esc(S.rec)}</div><p>${esc(S.trade)}</p></div>
<div class="two"><div class="box"><div class="lab"><i class="mk ana"></i>Key uncertainty</div><p>${esc(S.unc)}</p></div><div class="box"><div class="lab"><i class="mk ana"></i>Next action</div><p>${esc(S.next)}</p></div></div>
<h2>What the analysis rests on</h2>
<table><thead><tr><th>Input</th><th>Value</th><th>Type</th></tr></thead><tbody>
<tr><td>Budget to place</td><td>₹100 crore</td><td><i class="mk y"></i>Customer-provided</td></tr>
<tr><td>Current split across the three routes</td><td>${d.plan.join(' / ')}</td><td><i class="mk y"></i>Customer-provided</td></tr>
<tr><td>Contribution margin for each route</td><td>Ranges below</td><td><i class="mk"></i>Public source (example)</td></tr>
<tr><td>Sales at half the budget, and how fast returns fade</td><td>Ranges below</td><td><i class="mk a"></i>Assumption</td></tr>
</tbody></table>
<h2 style="margin-top:12pt">Ranges used for each route: low / typical / high</h2>
<table><thead><tr><th>Route</th><th>Sales at half the budget, ₹ crore</th><th>Contribution margin</th><th>How fast returns fade</th></tr></thead><tbody>${rows}</tbody></table>
<p class="note">Typical values are in bold. The workflow draws 5,000 scenarios from these ranges.</p>
${body}
<div class="rev"><b>Review status.</b> Draft prepared by a configured workflow. In a live job, a person reads the exceptions, edits the draft and approves it before it is shared. This sample has not been reviewed against any real company.</div>
<div class="foot">Generated from the Second Analyst demo engine: 5,000 scenarios, fixed seed. Illustrative figures, not a forecast.</div>
</body></html>`;
 fs.writeFileSync(__dirname+'/memo.html',html);
 const pg=await (await b.newContext()).newPage(); await pg.goto('file://'+__dirname+'/memo.html'); await pg.waitForTimeout(500);
 await pg.pdf({path:'/home/user/Projects/decision-memo/assets/sample-decision-memo.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
 await b.close(); console.log('pdf ok');})();
