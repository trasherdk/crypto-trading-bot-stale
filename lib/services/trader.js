import BTC from './traders/binance/markets/bitcoin.js';
import ETH from './traders/binance/markets/ethereum.js';
import ADA from './traders/binance/markets/cardano.js';
import DOGE from './traders/binance/markets/dogecoin.js';
import BTT from './traders/binance/markets/bittorent.js';
import SHIB from './traders/binance/markets/shib.js';

import BinanceTrader from './traders/binance/binance-trader.js';

export default class Trader {

    constructor(app) {
        this.app = app;
    }

    run = () => {
        /** order bots invoke execution */
        setTimeout((new BinanceTrader(this.app, ETH)).start, 1000);
        // setTimeout((new BinanceTrader(this.app, BTC)).start, 10 * 1000);
        // setTimeout((new BinanceTrader(this.app, ADA)).start, 20 * 1000);
        // setTimeout((new BinanceTrader(this.app, DOGE)).start, 30 * 1000);
        // setTimeout((new BinanceTrader(this.app, BTT)).start, 40 * 1000);
        // setTimeout((new BinanceTrader(this.app, SHIB)).start, 50 * 1000);
    };
};
