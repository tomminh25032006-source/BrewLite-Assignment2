const path = require('path');
const { execSync } = require('child_process');

// Áp dụng migration lên database test trước khi chạy
module.exports = async () => {
  require('./setup-env');
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../apps/api'),
    env: process.env,
    stdio: 'inherit',
  });
};
