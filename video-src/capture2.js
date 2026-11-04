const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const c=await b.newContext({viewport:{width:1280,height:720}}); const p=await c.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.clock.install({time:0});
 await p.goto('file:///home/user/Projects/video-src/scene2.html?speed=0.5'); await p.waitForTimeout(500); await p.clock.pauseAt(5000); await p.evaluate(()=>window.__go());
 const FPS=30, TOTAL=+process.argv[2]||97; fs.mkdirSync('/tmp/vf2',{recursive:true});
 const step=1000/FPS; let acc=0;
 for(let i=0;i<TOTAL*FPS;i++){ await p.clock.runFor(step); await p.screenshot({path:'/tmp/vf2/f_'+String(i).padStart(5,'0')+'.jpg',type:'jpeg',quality:90}); if(i%300===0) console.log('frame',i,errs.length); }
 console.log('log',JSON.stringify(await p.evaluate(()=>({log:window.__vlog,pause:window.__pauseAt,done:window.__doneAt})))); console.log('errs',errs); console.log('done'); await b.close()})();
