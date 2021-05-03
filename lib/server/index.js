const http = require('http');

const trader = require('../services/trader');

module.exports = app => {
    app.server = http.createServer(app);

    app.listen(app.config.port, () => {
        console.log('Server running on port ' + app.config.port);

        /** invoke crypto trading bot(s) */
        trader.run();
    });
};
