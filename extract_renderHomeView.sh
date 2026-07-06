#!/bin/bash
cat src/App.tsx | awk '
BEGIN { p=0; }
/const renderHomeView = \(\) => {/ { p=1; }
p==1 { print $0; }
/return \(/ { p=2; }
p==2 && /^    };/ { p=0; print $0; }
' > renderHomeView_extracted.tsx
