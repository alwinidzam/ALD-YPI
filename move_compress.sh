#!/bin/bash
# Extract the function
sed -n '81,106p' src/App.tsx > compress_func.txt
# Remove from App.tsx
sed -i '81,106d' src/App.tsx
# Append to data.ts, with export
sed -i 's/function compressBase64Image/export function compressBase64Image/' compress_func.txt
cat compress_func.txt >> src/data.ts
