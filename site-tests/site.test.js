const { chromium } = require('playwright'); const fs=require('fs');
const ROOT='/home/user/Projects/decision-memo/', B='file://'+ROOT;
const PAGES=[['index','Home',''],['try-it-yourself','Try It Out','Try It Out'],['how-it-works','How It Works','How It Works'],['pricing','Pricing','Pricing'],['our-approach','Our Approach','Our Approach'],['contact','Discuss Your Requirements','Discuss Your Requirements']];
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)fails++;};
(async()=>{const b=await chromium.launch(); const errs=[];
 async function open(url,vw,vh,opts){ const ctx=await b.newContext(Object.assign({viewport:{width:vw||1440,height:vh||900}},opts||{})); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(url+' '+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(url+' '+m.text())}); p.on('requestfailed',r=>{ if(!/google|sendmail|example|workflow\.(mp4|webm)/.test(r.url())) errs.push('reqfail '+r.url())}); await p.goto(B+url); await p.waitForTimeout(250); return p; }

 // ---- 1. navigation, active state, one line, no overflow at four widths
 for(const w of [1440,1280,1024]){ for(const [f,label,navText] of PAGES){ const p=await open(f+'.html',w,800);
   const r=await p.evaluate(()=>{const links=[...document.querySelectorAll('.nav a')];const cur=document.querySelector('.nav a[aria-current=page]');return {hs:links.map(a=>Math.round(a.getBoundingClientRect().height)),texts:links.map(a=>a.textContent),cur:cur?cur.textContent:null,navRight:document.querySelector('.nav').getBoundingClientRect().right,vw:innerWidth,ov:document.documentElement.scrollWidth-document.documentElement.clientWidth,brandR:document.querySelector('.word').getBoundingClientRect().right,navL:document.querySelector('.nav').getBoundingClientRect().left}});
   ok(r.texts.join('|')==='Try It Out|How It Works|Pricing|Our Approach|Discuss Your Requirements','nav labels at '+w+' '+f);
   ok(Math.max(...r.hs)<=44&&r.navRight<=r.vw&&r.brandR<r.navL&&r.ov===0,'nav on one line, no overflow at '+w+' '+f+' (heights '+r.hs.join(',')+')');
   if(f!=='index') ok(r.cur===navText,'active page indicator '+f+' = '+r.cur); else ok(r.cur===null,'home has no active nav item');
   await p.context().close(); } }
 // ---- 2. mobile menu
 for(const w of [390,360]){ const p=await open('index.html',w,800);
   const hdr0=await p.evaluate(()=>document.querySelector('.mast').getBoundingClientRect().height);
   ok(!(await p.isVisible('.nav'))&&await p.isVisible('#burger'),'mobile '+w+': no nav row, hamburger shown (header '+hdr0+'px)');
   await p.click('#burger'); ok(await p.isVisible('#mpanel')&&(await p.getAttribute('#burger','aria-expanded'))==='true','mobile '+w+': hamburger opens the panel');
   const items=await p.$$eval('#mpanel a',a=>a.map(x=>x.textContent)); ok(items.join('|')==='Try It Out|How It Works|Pricing|Our Approach|Discuss Your Requirements','mobile '+w+': menu items '+items.join(', '));
   const bh=await p.$eval('#mpanel .btn',e=>Math.round(e.getBoundingClientRect().height)); ok(bh>=48,'menu CTA is prominent ('+bh+'px)');
   const wrap=await p.$$eval('#mpanel a.l',a=>a.map(x=>Math.round(x.getBoundingClientRect().height))); ok(Math.max(...wrap)<=70,'menu links do not wrap: '+wrap.join(','));
   await p.keyboard.press('Escape'); ok(!(await p.isVisible('#mpanel')),'Escape closes the menu');
   await p.click('#burger'); await p.click('#scrim',{position:{x:20,y:400}}); ok(!(await p.isVisible('#mpanel')),'tapping the dimmed area closes the menu');
   await p.click('#burger'); await Promise.all([p.waitForNavigation(),p.click('#mpanel a[href="pricing.html"]')]); ok(/pricing\.html/.test(p.url()),'menu link navigates'); await p.waitForTimeout(200);
   ok(!(await p.isVisible('#mpanel'))&&(await p.getAttribute('#burger','aria-expanded'))==='false','menu is closed after navigating');
   await p.evaluate(()=>window.scrollTo(0,1500)); await p.waitForTimeout(200); const top=await p.evaluate(()=>Math.round(document.querySelector('.mast').getBoundingClientRect().top)); ok(top===0,'header stays sticky after scrolling');
   const act=await p.$eval('.mast .word',e=>e.getBoundingClientRect().left); ok(act>=19&&act<=21,'brand aligned to the 20px gutter ('+act+')');
   await p.context().close(); }

 // ---- 3. home
 { const p=await open('index.html'); 
   const h=await p.evaluate(()=>{const e=document.querySelector('.hero h1');return [e.textContent,Math.round(e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight))]});
   ok(h[0]==='Do the intelligence work without building a team.'&&h[1]===1,'home headline is new and on one line at 1440');
   const heads=await p.$$eval('section h2',a=>a.filter(x=>x.offsetParent).map(x=>x.innerText)); ok(heads.includes('See an intelligence job in action.')&&heads.includes('Explore an intelligence workflow.')&&heads.includes('Pricing built around your requirements.'),'desktop headings: '+heads.join(' | '));
   ok(!(await p.textContent('body')).includes('add others as your requirements develop'),'removed pricing sentence is gone');
   ok((await p.textContent('.close h2'))==='Need recurring intelligence without adding to your team?','closing heading');
   const order=await p.evaluate(()=>{const s=[...document.querySelectorAll('main > section')].map(x=>x.className.split(' ')[0]+':'+(x.querySelector('h2,h3')||{}).textContent);return s});
   const iF=order.findIndex(x=>/Built on practical/.test(x)), iP=order.findIndex(x=>/Pricing built/.test(x)), iV=order.findIndex(x=>/Explore an intelligence/.test(x)); ok(iV<iF&&iF<iP,'founder block sits after the preview and before pricing');
   ok(await p.evaluate(()=>/led by Mandhir Dua/.test(document.querySelector('.fnd p').textContent)&&document.querySelector('.fnd p').textContent.length<420),'founder block is short');
   const lk=await p.getAttribute('.fnd a.lk','href'); ok(lk==='our-approach.html#experience','founder link target '+lk);
   const memo=await p.getAttribute('.memolink','href'); ok(memo==='assets/sample-decision-memo.pdf'&&fs.existsSync(ROOT+memo)&&fs.readFileSync(ROOT+memo).slice(0,4).toString()==='%PDF','sample memo link points at a real PDF');
   // preview interactions
   const rec0=await p.textContent('#pv-rec'); await p.click('#pv [data-q="price"]'); const rec1=await p.textContent('#pv-rec'); await p.click('#pv [data-i="pharma"]'); const rec2=await p.textContent('#pv-rec');
   ok(rec0!==rec1&&rec1!==rec2&&(await p.textContent('#pv-ctx')).includes('Pharma'),'preview changes with question and industry');
   const go=await p.getAttribute('#pv-go','href'); ok(/decision=price&industry=pharma&run=1/.test(go),'preview CTA deep-links to the sandbox: '+go);
   const pg=await p.getAttribute('.gfoot a','href'); ok(pg==='pricing.html','pricing CTA links to Pricing');
   const ct=await p.$$eval('.btn',a=>a.map(x=>x.getAttribute('href'))); ok(ct.includes('contact.html'),'discuss CTA links to contact');
   await p.context().close(); }
 { const p=await open('index.html',390,844); const heads=await p.$$eval('section h2',a=>a.filter(x=>x.offsetParent).map(x=>x.innerText)); ok(heads.includes('See it in action.')&&heads.includes('Explore a workflow.'),'mobile headings: '+heads.join(' | '));
   ok(await p.isVisible('.totop'),'back to top is shown on the long mobile home page'); await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.click('.totop'); await p.waitForTimeout(2500); ok((await p.evaluate(()=>scrollY))<5,'back to top works');
   await p.context().close(); }

 // ---- 4. sandbox: every combination, by clicking, on desktop
 { const p=await open('try-it-yourself.html?speed=40'); const decs=['watch','budget','price','rank','market','bench'], inds=['hotels','pharma','telecom']; let allok=true, bad=[];
   for(const d of decs) for(const i of inds){ await p.click('.ctrl [data-g="dec"][data-v="'+d+'"]'); await p.click('.ctrl [data-g="ind"][data-v="'+i+'"]');
     try{ await p.waitForSelector('#stage.done',{timeout:30000}); }catch(e){ allok=false; bad.push(d+'/'+i+' no result'); continue; }
     const r=await p.evaluate(()=>({rec:document.querySelector('.vr-p.big')&&document.querySelector('.vr-p.big').textContent,memo:!!document.querySelector('.v-memo h3'),labels:[...document.querySelectorAll('.vr-l')].map(x=>x.textContent)}));
     if(!(r.rec&&r.rec.length>5&&r.memo&&r.labels.join()==='Recommendation,Trade-off,Key uncertainty,Next action')){allok=false;bad.push(d+'/'+i);} }
   ok(allok,'all 18 job and industry combinations run to an answer and a memo by clicking'+(bad.length?' '+bad.join(','):'')); 
   const legend=await p.$$eval('.st-key span',a=>a.map(x=>x.textContent.trim())); ok(legend.join('|')==='Public source|Customer-provided|Assumption|Analysis','sandbox legend: '+legend.join(', '));
   // adjustable input
   await p.click('.ctrl [data-g="dec"][data-v="budget"]'); await p.click('.ctrl [data-g="ind"][data-v="hotels"]'); await p.waitForSelector('#stage.done'); const t0=await p.textContent('.vr-g'); await p.selectOption('.ctrl .in-split','30 / 50 / 20'); await p.waitForFunction(()=>!document.getElementById('stage').classList.contains('done')); await p.waitForSelector('#stage.done',{timeout:30000}); const t1=await p.textContent('.vr-g');
   ok(/20 \/ 60 \/ 20/.test(t0)&&/30 \/ 50 \/ 20/.test(t1),'changing the current split re-runs with the new split');
   const dl=await Promise.all([p.waitForEvent('download'),p.click('#st-dl')]); ok(/decision-memo-hotels-budget\.md$/.test(dl[0].suggestedFilename()),'memo download works: '+dl[0].suggestedFilename());
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth); ok(ov===0,'no overflow with a full result at 1440'); await p.context().close(); }
 { const p=await open('try-it-yourself.html?speed=40',1280,800); await p.click('.ctrl [data-g="dec"][data-v="bench"]'); await p.click('.ctrl [data-g="ind"][data-v="telecom"]'); await p.waitForSelector('#stage.done',{timeout:30000});
   const ov=await p.evaluate(()=>[document.documentElement.scrollWidth-document.documentElement.clientWidth,[...document.querySelectorAll('.v-table')].some(t=>t.scrollWidth>t.clientWidth+2)]); ok(ov[0]===0,'no page overflow with the benchmark table at 1280 (table scroll: '+ov[1]+')'); await p.context().close(); }
 for(const w of [390,360]){ const p=await open('try-it-yourself.html?speed=40',w,800); ok(!(await p.isVisible('.ctrl'))&&await p.isVisible('.mctrl'),'mobile '+w+': compact controls, not the desktop panel');
   await p.selectOption('#m-dec','price'); await p.click('.mctrl [data-g="ind"][data-v="pharma"]'); await p.waitForSelector('#stage.done',{timeout:30000});
   const r=await p.evaluate(()=>({ov:document.documentElement.scrollWidth-document.documentElement.clientWidth,rec:document.querySelector('.vr-p.big').textContent.slice(0,40),sel:document.getElementById('m-dec').value}));
   ok(r.ov===0&&r.sel==='price','mobile '+w+': select + industry run a result, no overflow ('+r.rec+')'); await p.context().close(); }

 // ---- 5. how it works
 { const p=await open('how-it-works.html'); const vis=async()=>p.$$eval('.sitem',a=>a.filter(x=>x.offsetParent&&getComputedStyle(x).display!=='none').map(x=>x.getAttribute('data-name')));
   ok((await vis()).join()==='Define the job','desktop: one stage panel visible at first');
   const tabs=await p.$$eval('.tabs5 [role=tab]',a=>a.map(x=>x.textContent.replace(/^\d/,''))); ok(tabs.join('|')==='Define the job|Set the evidence and rules|Configure and test|Run|Review the result','five stage tabs');
   await p.click('#tab2'); ok((await vis()).join()==='Set the evidence and rules'&&(await p.textContent('#sitem2')).includes('traceable source or be clearly identified as customer-provided information or an assumption'),'selecting a stage swaps the central panel; evidence copy present');
   ok(await p.$$eval('#sitem2 .leg4 span',a=>a.map(x=>x.textContent.trim()).join('|'))==='Public source|Customer-provided information|Assumption|Analysis or interpretation','four-way legend under stage 2');
   for(let i=3;i<=5;i++){ await p.click('#tab'+i); ok((await vis()).length===1,'stage '+i+' shows a single panel'); }
   await p.click('#st-prev'); ok((await vis()).join()==='Run','previous button works'); 
   ok(await p.$$eval('details.fq[open]',a=>a.length)===0,'FAQs are collapsed'); await p.context().close(); }
 { const p=await open('how-it-works.html#data'); await p.waitForTimeout(300); ok(await p.$eval('#data',e=>e.open),'#data link opens the data FAQ'); await p.context().close(); }
 for(const w of [390,360]){ const p=await open('how-it-works.html',w,800); ok(!(await p.isVisible('.tabs5')),'mobile '+w+': no tab row');
   const open1=async()=>p.$$eval('.sitem .h2',a=>a.map(x=>x.getAttribute('aria-expanded')));
   ok((await open1()).filter(x=>x==='true').length===1,'accordion: one stage expanded at first'); await p.click('#sitem4 .h2'); let s=await open1(); ok(s.join()==='false,false,false,true,false','opening a stage closes the others'); await p.click('#sitem4 .h2'); s=await open1(); ok(s.every(x=>x==='false'),'a stage can be collapsed');
   await p.click('#sitem2 .h2'); ok(await p.isVisible('#sitem2 .vis'),'diagram visible inside the open stage'); 
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth); ok(ov===0,'no overflow with the stage 2 diagram at '+w);
   await p.context().close(); }

 // ---- 6. our approach
 { const p=await open('our-approach.html'); const hs=await p.$$eval('main h1,main h2',a=>a.map(x=>x.textContent)); 
   ok(hs.join('|')==='A Different Way to Do Intelligence Work|Why not use a general-purpose AI tool?|Experience behind the work|Who is this designed for?','Our Approach structure: '+hs.join(' | '));
   ok(await p.$$eval('.ap > div',a=>a.length)===3&&await p.$eval('.ap .me',e=>!!e),'three-column comparison with the highlighted third');
   ok(await p.$$eval('.why p',a=>a.length)===3,'differentiation is three short paragraphs'); ok(!!(await p.$('#experience')),'#experience anchor exists');
   ok(await p.$$eval('.nots > div',a=>a.map(x=>x.textContent).join('|'))==='NotA general-purpose AI chatbot|NotA self-service software subscription|NotAn unlimited outsourced analyst service|NotA replacement for every strategy or intelligence team','the four "not" statements');
   ok(!(await p.textContent('body')).includes('Decision Memo'),'no stray "Decision Memo" brand'); await p.context().close(); }

 // ---- 7. pricing: calculations, ceiling, carry-over, form
 const money=n=>'$'+Math.round(n).toLocaleString('en-US');
 { const p=await open('pricing.html'); const R=await p.evaluate(()=>{const P=window.__plan, ids=P.CATALOGUE.map(j=>j.id), E=j=>P.estimate({jobs:j}); const o={n:0,worst:0,badCeil:0,badSetup:0,recon:0,lh:0,ids:ids};
     for(let m=0;m<(1<<ids.length);m++){const sub=ids.filter((_,i)=>m&(1<<i)),e=E(sub);o.n++;if(e.annual[1]>o.worst)o.worst=e.annual[1];if(!(e.annual[1]<20000))o.badCeil++;if(e.setup!==(sub.length?1000:0))o.badSetup++;const sl=e.jobs.reduce((a,j)=>a+j.low,0),sh=e.jobs.reduce((a,j)=>a+j.top,0);if(e.annual[0]!==sl||e.annual[1]!==sh||e.firstYear[0]!==e.setup+sl||e.firstYear[1]!==e.setup+sh||e.ongoing[0]!==sl||e.ongoing[1]!==sh)o.recon++;if(e.annual[0]>e.annual[1])o.lh++;}
     o.one=E(['model']);o.three=E(['watch','model','verify']);o.all=E(ids);o.none=E([]);return o;});
   ok(R.ids.length===7,'seven jobs'); ok(R.n===128&&R.badCeil===0&&R.worst===13800,'all '+R.n+' combinations stay below $20,000 and below $15,000; highest '+money(R.worst));
   ok(R.badSetup===0,'setup is a flat $1,000 for every non-empty combination'); ok(R.recon===0&&R.lh===0,'totals reconcile in every combination (recurring = sum of jobs; first year = setup + recurring)');
   ok(R.none.annual[1]===0&&R.none.setup===0,'no jobs: zero, no setup'); ok(R.one.setup===1000&&R.one.annual[0]===1350&&R.one.annual[1]===2250&&R.one.firstYear[1]===3250,'one job: $1,350 to $2,250, first year to $3,250');
   ok(R.three.annual[0]===4200&&R.three.annual[1]===7050&&R.three.firstYear[0]===5200&&R.three.firstYear[1]===8050,'three jobs: $4,200 to $7,050; first year $5,200 to $8,050'); ok(R.all.annual[0]===8250&&R.all.annual[1]===13800&&R.all.firstYear[1]===14800,'all seven: $8,250 to $13,800; first year to $14,800');
   const txt=await p.textContent('main'); ok(!/30%|by-hand|by hand/i.test(txt),'no 30% / by-hand methodology claim on the page');
   ok(/None yet/.test(await p.textContent('#sum-body'))&&(await p.getAttribute('#send','aria-disabled'))==='true','page: no jobs shows no cost, disabled CTA');
   const pick=id=>p.click('#row-'+id+' .cb');
   await pick('model'); ok((await p.textContent('#t-ongoing'))==='$1,350 to $2,250'&&(await p.textContent('#t-setup'))==='$1,000'&&(await p.textContent('#t-first'))==='about $2,350 to $3,250','page: one job'); 
   await pick('watch'); await pick('verify'); ok((await p.textContent('#t-ongoing'))==='$4,200 to $7,050'&&(await p.textContent('#t-setup'))==='$1,000'&&(await p.textContent('#t-ongoing2'))==='$4,200 to $7,050','page: three jobs, setup unchanged, ongoing shown separately from first year');
   ok(/Provisional/.test(await p.textContent('#sum'))&&/Billed separately/.test(await p.textContent('#sum')),'summary is labelled provisional and shows analyst fees separately');
   await pick('verify'); await pick('watch'); await pick('model'); ok(/None yet/.test(await p.textContent('#sum-body')),'removing all jobs returns to empty');
   for(const id of R.ids) await pick(id); ok((await p.textContent('#t-ongoing'))==='$8,250 to $13,800'&&(await p.textContent('#t-first'))==='about $9,250 to $14,800','page: all seven jobs');
   ok(/\$8,250 to \$13,800 a year, excluding optional analyst fees/.test(await p.textContent('.cap')),'cap line reconciles with the total');
   // carry-over
   for(const id of R.ids.slice(3)) await pick(id); // leave watch, research, docs
   await p.click('#fr-watch [data-freq="weekly"]'); const href=decodeURIComponent(await p.getAttribute('#send','href')); ok(/^contact\.html\?plan=/.test(await p.getAttribute('#send','href'))&&/Watch competitors and markets \(weekly\)/.test(href)&&/Indicative cost \(provisional\)/.test(href)&&/billed separately/.test(href),'plan link carries jobs, chosen frequency and cost');
   const faqs=await p.$$eval('.faq summary',a=>a.map(x=>x.textContent)); ok(['How is the price built?','What is included in a workflow?','Can I start with one job?','Can the scope change?','Is setup charged again?','What does optional analyst involvement cover?','Can you support a requirement that is not shown here?'].every(q=>faqs.includes(q)),'all seven pricing FAQs present');
   ok(/What does a recurring workflow fee cover\?/.test(txt)&&txt.indexOf('What does a recurring workflow fee cover?')<txt.indexOf('Choose your jobs'),'coverage explanation sits above the calculator');
   const kb=await p.evaluate(()=>{const c=document.getElementById('job-research');c.focus();return true}); await p.keyboard.press('Space'); ok(!(await p.isChecked('#job-research')),'a job can be toggled from the keyboard');
   await p.click('#send'); await p.waitForTimeout(300); ok(/contact\.html/.test(p.url())&&(await p.isVisible('#plan-box')),'Discuss CTA opens contact with the plan box');
   ok(/Watch competitors and markets \(weekly\)/.test(await p.textContent('#plan-text')),'plan text shown on the contact page');
   // submit to a stand-in Google endpoint
   let posted=null; await p.route('https://docs.google.com/**',r=>{posted=r.request().postData(); r.fulfill({status:200,body:'ok'})});
   await p.fill('#f-pain','Each month I need a short note on what my three main competitors changed.'); await p.fill('#f-contact','a@b.co'); await p.click('#send'); await p.waitForSelector('#form-msg.ok'); 
   const body=decodeURIComponent((posted||'').replace(/\+/g,' ')); ok(/entry\.719865794=/.test(body)&&/Plan from the pricing page/.test(body)&&/Watch competitors and markets \(weekly\)/.test(body)&&/entry\.829357577=a@b\.co/.test(body),'form posts message, plan and contact to the Google Form endpoint');
   ok(/Thank you/.test(await p.textContent('#form-msg')),'success message shown'); await p.context().close(); }
 { const p=await open('contact.html'); await p.fill('#f-pain','short'); await p.fill('#f-contact','nope'); await p.click('#send'); ok(await p.$eval('#form-msg',e=>e.classList.contains('err')&&/sentence or two/.test(e.textContent)),'validation: short message is rejected');
   await p.fill('#f-pain','A recurring job I want checked every month.'); await p.click('#send'); ok(/email address or a LinkedIn/.test(await p.textContent('#form-msg')),'validation: bad contact is rejected');
   await p.fill('#f-contact','https://www.linkedin.com/in/someone'); await p.route('https://docs.google.com/**',r=>r.abort()); await p.click('#send'); await p.waitForSelector('#form-msg.err'); ok(/did not go through/.test(await p.textContent('#form-msg')),'error state: network failure is reported, nothing claimed sent');
   await p.context().close(); }
 { const p=await open('contact.html'); await p.route('**/assets/config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.SITE={googleForm:{},formEndpoint:"",contactEmail:""};'})); await p.reload(); await p.fill('#f-pain','A recurring job I want checked every month.'); await p.fill('#f-contact','a@b.co'); await p.click('#send'); ok(/not connected yet/.test(await p.textContent('#form-msg')),'not-connected state: says nothing was sent'); await p.context().close(); }
 for(const w of [390,360]){ const p=await open('contact.html?plan='+encodeURIComponent('Jobs: Watch competitors and markets (monthly).\nIndicative cost (provisional): one-time setup $1,000; recurring $1,600 to $2,700 a year; first year $2,600 to $3,700.'),w,800);
   const pos=await p.evaluate(()=>({form:document.getElementById('ask').getBoundingClientRect().top,priv:document.getElementById('data-handling').getBoundingClientRect().top,plan:!document.getElementById('plan-box').hidden,ov:document.documentElement.scrollWidth-document.documentElement.clientWidth,note:document.querySelector('.form .note').textContent}));
   ok(pos.priv>pos.form&&pos.plan&&pos.ov===0,'mobile '+w+': privacy block sits below the form, plan shown, no overflow'); ok(!/on the left/.test(pos.note)&&/How your data is handled/.test(pos.note),'mobile note uses the simple link wording');
   const fh=await p.$$eval('.foot nav a',a=>a.map(x=>Math.round(x.getBoundingClientRect().height))); ok(Math.max(...fh)<=24,'footer links do not wrap ('+fh.join(',')+')'); await p.context().close(); }

 // ---- 8. overflow at four widths, every page, with errors
 for(const w of [1440,1280,390,360]) for(const [f] of PAGES){ const p=await open(f+'.html',w,800); await p.waitForTimeout(f==='index'?600:200); const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth); ok(ov===0,'no horizontal overflow '+w+' '+f); await p.context().close(); }
 ok(errs.length===0,'no console errors or failed requests '+JSON.stringify(errs.slice(0,4)));
 console.log(fails?('FAILS '+fails):'ALL PASS'); await b.close();})();
