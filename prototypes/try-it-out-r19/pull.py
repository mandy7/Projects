import json, urllib.request, time, datetime, sys
UA="SecondAnalystDemo/1.0 (research prototype)"
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':UA,'Accept-Encoding':'identity'})
    return json.load(urllib.request.urlopen(r,timeout=40))
CO={'hotels':[('Marriott International',1048286),('Hilton Worldwide',1585689),('Hyatt Hotels',1468174),('Wyndham Hotels & Resorts',1722684)],
    'pharma':[('Novo Nordisk',353278),('Eli Lilly',59478),('Pfizer',78003),('Amgen',318154)],
    'telecom':[('Verizon',732712),('AT&T',732717),('T-Mobile US',1283699),('Comcast',1166691)]}
out={}
for ind,lst in CO.items():
    out[ind]=[]
    for name,cik in lst:
        d=get('https://data.sec.gov/submissions/CIK%010d.json'%cik); time.sleep(0.4)
        rec=d['filings']['recent']; n=len(rec['form'])
        items=[]
        for i in range(n):
            items.append(dict(date=rec['filingDate'][i],form=rec['form'][i],items=rec.get('items',[''])[i],doc=rec['primaryDocument'][i],acc=rec['accessionNumber'][i],desc=rec.get('primaryDocDescription',[''])[i]))
        out[ind].append(dict(name=name,cik=cik,sec_name=d['name'],tickers=d.get('tickers'),filings=items))
        print(ind,name,d['name'],n,items[0]['date'],items[0]['form'])
json.dump(out,open('edgar_raw.json','w'))
