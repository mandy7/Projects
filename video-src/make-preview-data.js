const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const p=await (await b.newContext()).newPage();
 await p.goto('file:///home/user/Projects/decision-memo/try-it-yourself.html'); await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{const D=window.__demo,o={};for(const dk of ['budget','price','watch'])for(const ik of ['hotels','pharma','telecom']){const pl=D.plan(ik,dk);o[dk+'.'+ik]={q:D.DEC[dk].q,s:pl.summary,n:pl.steps.length,ind:D.IND[ik].label,co:D.IND[ik].co};}return o;});
 fs.writeFileSync(__dirname+'/prev.json',JSON.stringify(out,null,1)); console.log(Object.keys(out).length); console.log(JSON.stringify(out['budget.hotels'],null,1)); console.log(JSON.stringify(out['watch.pharma'],null,1).slice(0,900));
 await b.close()})();
