const { execSync } = require('child_process');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log("Lint passed");
} catch (e) {
  console.error("Lint failed");
  process.exit(1);
}
