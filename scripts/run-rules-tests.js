const { execSync } = require('child_process');
const fs = require('fs');

const env = { ...process.env };
const macJava21 = '/opt/homebrew/opt/openjdk@21';

// On macOS with Homebrew OpenJDK 21, ensure JAVA_HOME is configured
if (process.platform === 'darwin' && fs.existsSync(macJava21)) {
  env.JAVA_HOME = `${macJava21}/libexec/openjdk.jdk/Contents/Home`;
  env.PATH = `${macJava21}/bin:${env.PATH || ''}`;
}

try {
  execSync('npx --yes firebase-tools emulators:exec --only firestore "npm --prefix functions run test:rules"', {
    stdio: 'inherit',
    env,
  });
} catch (error) {
  process.exit(error.status || 1);
}
