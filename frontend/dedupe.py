import os
import glob

files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    if 'import { serverApi }' in content:
        lines = content.split('\n')
        new_lines = []
        added = False
        for line in lines:
            if 'import { serverApi }' in line:
                if not added:
                    new_lines.append('import { serverApi } from "@/lib/server-api";')
                    added = True
            else:
                new_lines.append(line)
        with open(file, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"Deduped {file}")
