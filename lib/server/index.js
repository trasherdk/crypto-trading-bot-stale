const http = require('http');

// TODO: migrate from the main server file
const trader = require('../services/trader');

module.exports = app => {
    app.server = http.createServer(app);

    app.listen(app.config.port, () => {
        console.log('Server running on port ' + app.config.port);
    });

    /** invoke crypto trading bot */
    trader.run();
};
