import os
import glob

files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    if file == 'src/lib/api.ts' or file == 'src/lib/server-api.ts':
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    changed = False
    if 'api.auth()' in content:
        content = content.replace('api.auth()', 'serverApi.auth()')
        
        # update import
        if 'import { api } from "@/lib/api"' in content or 'import { api } from "@/lib/api";' in content:
            # We want to add serverApi
            content = content.replace('import { api } from "@/lib/api";', 'import { api } from "@/lib/api";\nimport { serverApi } from "@/lib/server-api";')
            content = content.replace('import { api } from "@/lib/api"', 'import { api } from "@/lib/api"\nimport { serverApi } from "@/lib/server-api"')
        changed = True
        
    if changed:
        with open(file, 'w') as f:
            f.write(content)
        print(f"Updated {file}")

