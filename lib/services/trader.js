import BTC from './traders/markets/bitcoin.js';
import ETH from './traders/markets/ethereum.js';
import ADA from './traders/markets/cardano.js';
import DOGE from './traders/markets/dogecoin.js';
import BTT from './traders/markets/bittorent.js';
import SHIB from './traders/markets/shib.js';

import BinanceTrader from './traders/binance.js';

export default class Trader {

    constructor(app) {
        this.app = app;
    }

    run = () => {
        /** order bots invoke execution */
        setTimeout((new BinanceTrader(this.app, BTC)).start, 1000);
        setTimeout((new BinanceTrader(this.app, ETH)).start, 10 * 1000);
        setTimeout((new BinanceTrader(this.app, ADA)).start, 20 * 1000);
        setTimeout((new BinanceTrader(this.app, DOGE)).start, 30 * 1000);
        setTimeout((new BinanceTrader(this.app, BTT)).start, 40 * 1000);
        setTimeout((new BinanceTrader(this.app, SHIB)).start, 50 * 1000);
    };
};
