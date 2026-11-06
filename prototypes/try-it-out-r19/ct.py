import json,urllib.request,urllib.parse,time
UA="SecondAnalystDemo/1.0 (research prototype)"
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':UA}); return json.load(urllib.request.urlopen(r,timeout=60))
out={}
for sp in ['Novo Nordisk A/S','Eli Lilly and Company','Pfizer','Amgen']:
    q=urllib.parse.urlencode({'query.spons':sp,'query.cond':'obesity','filter.advanced':'AREA[Phase]PHASE3 AND AREA[LastUpdatePostDate]RANGE[2026-08-01,MAX]','sort':'LastUpdatePostDate:desc','pageSize':8,'format':'json','countTotal':'true'})
    d=get('https://clinicaltrials.gov/api/v2/studies?'+q); time.sleep(0.5)
    rows=[]
    for s in d.get('studies',[]):
        p=s['protocolSection']; i=p['identificationModule']; st=p['statusModule']
        rows.append(dict(nct=i['nctId'],title=i.get('briefTitle'),org=i['organization']['fullName'],status=st.get('overallStatus'),updated=st.get('lastUpdatePostDateStruct',{}).get('date'),first=st.get('studyFirstPostDateStruct',{}).get('date'),pcd=st.get('primaryCompletionDateStruct',{}).get('date'),phases=p.get('designModule',{}).get('phases'),enroll=p.get('designModule',{}).get('enrollmentInfo',{}).get('count')))
    out[sp]=dict(total=d.get('totalCount'),rows=rows)
    print(sp,d.get('totalCount'))
    for r in rows[:5]: print('  ',r['nct'],r['updated'],r['status'],r['phases'],r['title'][:80])
json.dump(out,open('ct_raw.json','w'))
