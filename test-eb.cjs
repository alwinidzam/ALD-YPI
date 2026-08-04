const fs = require('fs');
let code = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
code = code.replace(
  "export class ErrorBoundary extends Component<Props, State> {",
  "export class ErrorBoundary extends React.Component<Props, State> {"
);
fs.writeFileSync('src/components/ErrorBoundary.tsx', code);
