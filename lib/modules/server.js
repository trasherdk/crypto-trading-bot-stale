import http from 'http';
import favicon from 'serve-favicon';

import Trader from '../services/trader.js';

export default function server(app) {
    app.server = http.createServer(app);

    app.listen(app.config.port, () => {
        console.log('Server running on port ' + app.config.port);

        /** invoke crypto trading bot(s) */
        const trader = new Trader();
        trader.run();
    });

    /** set favicon */
    app.use(favicon('favicon.ico'));
}
