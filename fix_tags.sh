#!/bin/bash
cat src/App.tsx | sed '
/                    }))}/{
  N
  N
  N
  N
  N
  N
  N
  N
  s/                    }))}\n                  <\/div>\n                  <\/SectionErrorBoundary>\n            <\/div>\n          );\n        })()}\n          <\/SectionErrorBoundary>/                    }))}\n                  <\/div>\n                )}\n              <\/div>\n            <\/div>\n          );\n        })()}\n          <\/SectionErrorBoundary>\n        <\/div>/
}' > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
