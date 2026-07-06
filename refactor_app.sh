#!/bin/bash
# Remove the old state and useEffect block
sed -i '175,202d' src/App.tsx
