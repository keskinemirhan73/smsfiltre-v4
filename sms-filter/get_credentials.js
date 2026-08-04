const { spawn } = require('child_process');

const eas = spawn('eas.cmd', ['credentials', '-p', 'android'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let state = 0;

eas.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Which build profile do you want to configure?')) {
    eas.stdin.write('\n'); // Select 'production'
  }
  else if (output.includes('What do you want to do?')) {
    // We want to download the keystore
    // Usually the options are: 
    // - Set up a new keystore
    // - Download the keystore
    // We need to send arrow down and enter.
    eas.stdin.write('\x1B[B\n'); // Arrow down, Enter (assuming Download is second option)
  }
});

eas.stderr.on('data', (data) => {
  console.error(data.toString());
});

eas.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
