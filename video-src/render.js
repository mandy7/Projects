const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1280,height:720}});
 await p.goto('file:///home/user/Projects/video-src/scene.html'); await p.waitForTimeout(600);
 const FPS=30, N=62*FPS;
 for(let i=0;i<N;i++){ await p.evaluate(t=>window.render(t),i/FPS); await p.screenshot({path:'/tmp/vframes/f_'+String(i).padStart(5,'0')+'.jpg',type:'jpeg',quality:90}); if(i%300===0) console.log('frame',i); }
 console.log('done'); await b.close()})();
