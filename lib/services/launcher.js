import BTC from './binance/markets/bitcoin.js';
import ETH from './binance/markets/ethereum.js';
import DOGE from './binance/markets/dogecoin.js';
import SHIB from './binance/markets/shib.js';

import BinanceTrader from './binance/trader.js';

export default class Launcher {

    constructor(app) {
        this.app = app;
    }

    run = () => {
        /** invoke execution order of traders */
        setTimeout((new BinanceTrader(this.app, ETH)).start, 1000);
        // setTimeout((new BinanceTrader(this.app, BTC)).start, 10 * 1000);
        // setTimeout((new BinanceTrader(this.app, DOGE)).start, 20 * 1000);
        // setTimeout((new BinanceTrader(this.app, SHIB)).start, 30 * 1000);
    };
};
