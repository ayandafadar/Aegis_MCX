import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

symbols = {
    'GOLD': 'GC=F',
    'SILVER': 'SI=F',
    'CRUDEOIL': 'CL=F',
    'NATURALGAS': 'NG=F',
    'COPPER': 'HG=F',
    'ZINC': 'ZNC=F',
    'ALUMINIUM': 'ALI=F',
    'NICKEL': 'ALI=F' 
}

# we'll approximate COMEX scaled to INR as MCX 
values = {}
for name, sym in symbols.items():
    try:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            val = data['chart']['result'][0]['meta']['regularMarketPrice']
            values[name] = val
    except Exception as e:
        values[name] = 0

print(json.dumps(values))
