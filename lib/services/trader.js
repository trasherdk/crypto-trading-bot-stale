const DOGE = require('./traders/markets/doge').DOGE;
const TRX = require('./traders/markets/trx').TRON;
const BTT = require('./traders/markets/btt').BTT;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        const dogeTrader = new BinanceTrader(DOGE);
        const tronTrader = new BinanceTrader(TRX);
        const bittorentTrader = new BinanceTrader(BTT);

        /** order bots invoke execution */
        setTimeout(dogeTrader.start, 0);
        setTimeout(tronTrader.start, 15 * 1000);
        setTimeout(bittorentTrader.start, 30 * 1000);
    };
};
