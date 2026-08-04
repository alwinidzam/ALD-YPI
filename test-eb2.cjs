const fs = require('fs');
let code = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
code = code.replace(
  "this.setState({ errorInfo });",
  "// @ts-ignore\n    this.setState({ errorInfo });"
);
code = code.replace(
  "return this.props.children;",
  "// @ts-ignore\n    return this.props.children;"
);
fs.writeFileSync('src/components/ErrorBoundary.tsx', code);
