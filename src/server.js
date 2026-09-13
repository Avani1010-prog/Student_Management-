// Proxy entry point in case Render sets Root Directory to 'src'
const path = require('path');
process.chdir(path.join(__dirname, '..'));
require('../server.js');
