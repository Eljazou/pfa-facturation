const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3001;
const dbPath = path.join(__dirname, 'db.json');
const bin   = path.join(__dirname, 'node_modules', 'json-server', 'lib', 'bin.js');

console.log(`Starting JSON Server on port ${PORT}`);

const proc = spawn(process.execPath, [bin, dbPath, '--port', String(PORT), '--host', '0.0.0.0'], {
  stdio: 'inherit',
});

proc.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGTERM', () => proc.kill('SIGTERM'));
process.on('SIGINT',  () => proc.kill('SIGINT'));
