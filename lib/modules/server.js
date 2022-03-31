import http from 'http';
import favicon from 'serve-favicon';

import Launcher from '../services/launcher.js';

export default function server(app) {
    app.server = http.createServer(app);

    app.listen(app.config.port, () => {
        console.log('Server running on port ' + app.config.port);

        /** invoke crypto trading bot(s) */
        const launcher = new Launcher(app);
        launcher.run();
    });

    /** set favicon */
    app.use(favicon('favicon.ico'));
}
