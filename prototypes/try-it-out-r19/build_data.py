import json,urllib.request,urllib.parse,time,datetime,re
UA="SecondAnalystDemo/1.0 (research prototype)"
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':UA}); return json.load(urllib.request.urlopen(r,timeout=60))
raw=json.load(open('edgar_raw.json')); facts=json.load(open('facts_raw.json'))
SNAP='2026-11-06'; SINCE='2026-07-01'
# trials first posted since SINCE
SPON={'Novo Nordisk':'Novo Nordisk A/S','Eli Lilly':'Eli Lilly and Company','Pfizer':'Pfizer','Amgen':'Amgen'}
trials={}
for k,sp in SPON.items():
    q=urllib.parse.urlencode({'query.spons':sp,'query.cond':'obesity','filter.advanced':'AREA[Phase]PHASE3 AND AREA[StudyFirstPostDate]RANGE[%s,MAX]'%SINCE,'sort':'StudyFirstPostDate:desc','pageSize':50,'format':'json','countTotal':'true'})
    d=get('https://clinicaltrials.gov/api/v2/studies?'+q); time.sleep(0.5); rows=[]
    for s in d.get('studies',[]):
        p=s['protocolSection']; i=p['identificationModule']; st=p['statusModule']
        rows.append(dict(id=i['nctId'],t=i.get('briefTitle'),st=st.get('overallStatus'),first=st.get('studyFirstPostDateStruct',{}).get('date'),upd=st.get('lastUpdatePostDateStruct',{}).get('date')))
    trials[k]=rows; print(k,len(rows),d.get('totalCount'))
KEEP={'8-K','6-K','10-Q','10-K','20-F','424B2','424B5','S-3ASR','S-3','8-K/A'}
def q_(c,key):
    r=facts.get(c,{}).get(key); return r['rows'] if r else []
def yoy(rows):
    if not rows: return None
    last=rows[-1]; le=datetime.date.fromisoformat(last['end'])
    for r in rows:
        e=datetime.date.fromisoformat(r['end'])
        if 350<=(le-e).days<=380: return dict(end=last['end'],val=last['val'],prev=r['val'],prev_end=r['end'],form=last['form'],filed=last['filed'])
    return dict(end=last['end'],val=last['val'],prev=None,prev_end=None,form=last['form'],filed=last['filed'])
META={'Marriott International':('Marriott','MAR','Nasdaq'),'Hilton Worldwide':('Hilton','HLT','NYSE'),'Hyatt Hotels':('Hyatt','H','NYSE'),'Wyndham Hotels & Resorts':('Wyndham','WH','NYSE'),
 'Novo Nordisk':('Novo Nordisk','NVO','NYSE (ADR)'),'Eli Lilly':('Eli Lilly','LLY','NYSE'),'Pfizer':('Pfizer','PFE','NYSE'),'Amgen':('Amgen','AMGN','Nasdaq'),
 'Verizon':('Verizon','VZ','NYSE'),'AT&T':('AT&T','T','NYSE'),'T-Mobile US':('T-Mobile','TMUS','Nasdaq'),'Comcast':('Comcast','CMCSA','Nasdaq')}
out=dict(snapshot=SNAP,since=SINCE,industries={})
LAB={'hotels':'Hotels','pharma':'Pharma','telecom':'Telecom'}
for ind,lst in raw.items():
    cs=[]
    for c in lst:
        nm=c['name']; sh,tk,ex=META[nm]
        fl=[dict(d=f['date'],f=f['form'],i=f['items'],a=f['acc'],p=f['doc']) for f in c['filings'] if f['form'] in KEEP and f['date']>=SINCE]
        fin={}
        for key in ['revenue','operating_income','net_income','rd']:
            y=yoy(q_(nm,key))
            if y: fin[key]=y
        co=dict(id=re.sub(r'[^a-z]','',sh.lower()),name=sh,legal=c['sec_name'],ticker=tk,exch=ex,cik=c['cik'],filings=fl,fin=fin)
        if nm in trials: co['trials']=trials[nm]
        cs.append(co)
    out['industries'][ind]=dict(label=LAB[ind],companies=cs)
js='/* Snapshot of real public records, pulled %s from SEC EDGAR (data.sec.gov) and ClinicalTrials.gov (clinicaltrials.gov/api/v2). Filings since %s. Nothing here is fetched live by the page. */\nwindow.CW=%s;\n'%(SNAP,SINCE,json.dumps(out,separators=(',',':')))
open('competitor-data.js','w').write(js); print(len(js))
for ind in out['industries']:
    for c in out['industries'][ind]['companies']:
        r=c['fin'].get('revenue'); 
        print(ind,c['name'],len(c['filings']),'rev',(r['val']/1e9,(r['val']/r['prev']-1)*100 if r and r['prev'] else None) if r else None,'opm',(c['fin']['operating_income']['val']/r['val']*100 if 'operating_income' in c['fin'] and r else None),'trials',len(c.get('trials',[])))
