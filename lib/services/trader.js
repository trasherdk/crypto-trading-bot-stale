const DOGE = require('./traders/markets/dogecoin').dogecoin;
const ETH = require('./traders/markets/ethereum').ethereum;
const BTT = require('./traders/markets/btt').bittorrent;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        const dogeTrader = new BinanceTrader(DOGE);
        const ethereumTrader = new BinanceTrader(ETH);
        const bittorentTrader = new BinanceTrader(BTT);

        /** order bots invoke execution */
        setTimeout(ethereumTrader.start, 1000);
        setTimeout(dogeTrader.start, 10 * 1000);
        setTimeout(bittorentTrader.start, 20 * 1000);
    };
};
