import json,urllib.request,time,datetime
UA="SecondAnalystDemo/1.0 (research prototype)"
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':UA,'Accept-Encoding':'identity'}); return json.load(urllib.request.urlopen(r,timeout=60))
raw=json.load(open('edgar_raw.json'))
CONC={'revenue':['Revenues','RevenueFromContractWithCustomerExcludingAssessedTax','SalesRevenueNet','RevenueFromContractWithCustomerIncludingAssessedTax'],
      'operating_income':['OperatingIncomeLoss'],'net_income':['NetIncomeLoss','ProfitLoss'],'rd':['ResearchAndDevelopmentExpense','ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'],
      'capex':['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets']}
def dur(f):
    a=datetime.date.fromisoformat(f['start']);b=datetime.date.fromisoformat(f['end']);return (b-a).days
out={}
for ind,lst in raw.items():
    for c in lst:
        if c['name']=='Novo Nordisk': continue
        cik=c['cik']
        try: d=get('https://data.sec.gov/api/xbrl/companyfacts/CIK%010d.json'%cik)
        except Exception as e: print('ERR',c['name'],e); continue
        time.sleep(0.5)
        g=d['facts'].get('us-gaap',{}); res={}
        for k,names in CONC.items():
            best=None
            for n in names:
                if n in g and 'USD' in g[n]['units']:
                    q=[f for f in g[n]['units']['USD'] if 'start' in f and 80<=dur(f)<=100 and f['end']>='2025-01-01']
                    if q:
                        q.sort(key=lambda f:(f['end'],f['filed'])); 
                        if best is None or q[-1]['end']>best[1][-1]['end']: best=(n,q)
            if best:
                byend={}
                for f in best[1]: byend[f['end']]=f   # latest filed per end
                ends=sorted(byend)[-6:]
                res[k]=dict(tag=best[0],rows=[dict(end=e,val=byend[e]['val'],filed=byend[e]['filed'],form=byend[e]['form'],fp=byend[e].get('fp'),fy=byend[e].get('fy')) for e in ends])
        out[c['name']]=res
        r=res.get('revenue',{}).get('rows',[])
        print(ind,c['name'],{k:(v['tag'],v['rows'][-1]['end'],v['rows'][-1]['val']) for k,v in res.items()})
json.dump(out,open('facts_raw.json','w'))
