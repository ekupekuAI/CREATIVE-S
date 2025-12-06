import requests, sys, json
base = 'http://127.0.0.1:8000/api/event-planner'
headers = {'Content-Type':'application/json'}
try:
    print('Health ->', base + '/health')
    r = requests.get(base + '/health', timeout=10)
    print('Health:', r.status_code, r.text)
except Exception as e:
    print('Health check failed:', e)
    sys.exit(1)

print('\nPosting initial ai/plan (partial basics)...')
payload = {'basics': {'name':'AutoTest Event','type':'Conference'}}
try:
    r = requests.post(base + '/ai/plan', json=payload, headers=headers, timeout=30)
    print('ai/plan status:', r.status_code)
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print('ai/plan failed:', e)
    sys.exit(1)

resp = r.json()
if resp.get('data',{}).get('missing_fields'):
    print('\nMissing fields found:', resp['data']['missing_fields'])
    answers = {'date':'2025-12-15','attendees':120}
    payload2 = {'basics': {'name':'AutoTest Event','type':'Conference','date':answers['date'],'attendees':answers['attendees']}}
    try:
        r2 = requests.post(base + '/ai/plan', json=payload2, headers=headers, timeout=30)
        print('\nai/plan (filled) status:', r2.status_code)
        print(json.dumps(r2.json(), indent=2))
        final = r2.json()
    except Exception as e:
        print('ai/plan (filled) failed:', e)
        sys.exit(1)
else:
    final = resp

print('\nCreating event with preview...')
try:
    create_body = {'basics': final['data']['preview'].get('basic_info',{}), 'preview': final['data']['preview']}
    rc = requests.post(base + '/events', json=create_body, headers=headers, timeout=30)
    print('create event status:', rc.status_code)
    print(json.dumps(rc.json(), indent=2))
    event_id = rc.json().get('id')
except Exception as e:
    print('create event failed:', e)
    sys.exit(1)

for comp in ['budget','schedule','tasks','vendors']:
    print(f"\nGenerating component: {comp}")
    try:
        rg = requests.post(f"{base}/events/{event_id}/generate/{comp}", headers=headers, json={}, timeout=60)
        print(f"{comp} status:", rg.status_code)
        try:
            print(json.dumps(rg.json(), indent=2))
        except Exception:
            print(rg.text)
    except Exception as e:
        print(f"Generation failed for {comp}: {e}")

print('\nAll checks completed.')
