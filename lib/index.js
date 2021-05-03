const express = require('express');

let app = express();

/** framework modules */

require('./config')(app);
require('./routes')(app);
require('./services')(app);
require('./server')(app);

module.exports = app;
