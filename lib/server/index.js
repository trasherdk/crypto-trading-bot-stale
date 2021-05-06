const http = require('http');
const path = require('path');
const favicon = require('serve-favicon');

const trader = require('../services/trader');

module.exports = app => {
    app.server = http.createServer(app);

    app.listen(app.config.port, () => {
        console.log('Server running on port ' + app.config.port);

        /** invoke crypto trading bot(s) */
        trader.run();
    });

    /** set favicon */
    app.use(favicon(path.join(__dirname, '/../../', 'favicon.ico')));
};
