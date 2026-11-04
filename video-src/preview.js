const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1280,height:720}}); const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///home/user/Projects/video-src/scene.html'); await p.waitForTimeout(500);
 for(const t of [3,12,24,33,42,49,52.5,58,61]){ await p.evaluate(t=>window.render(t),t); await p.screenshot({path:'/tmp/claude-0/-home-user-Projects/8b8f0d8b-04dd-552d-92ad-ba3b49a8fd31/scratchpad/shots/vid-'+String(t).replace('.','_')+'.png'}); }
 console.log(errs); await b.close()})();
