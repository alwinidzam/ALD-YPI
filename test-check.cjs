const { execSync } = require('child_process');
try {
  execSync('npm run test', { stdio: 'inherit' });
  console.log("TESTS PASSED");
} catch(e) {
  console.log("TESTS FAILED");
}
