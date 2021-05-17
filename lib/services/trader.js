const ADA = require('./traders/markets/cardano').cardano;
const ETH = require('./traders/markets/ethereum').ethereum;
const DOGE = require('./traders/markets/dogecoin').dogecoin;
const SHIB = require('./traders/markets/shib').shib;
const BTT = require('./traders/markets/btt').bittorrent;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        const cardanoTrader = new BinanceTrader(ADA);
        const ethereumTrader = new BinanceTrader(ETH);
        const dogeTrader = new BinanceTrader(DOGE);
        const shibTrader = new BinanceTrader(SHIB);
        const bittorentTrader = new BinanceTrader(BTT);

        /** order bots invoke execution */
        setTimeout(cardanoTrader.start, 1000);
        setTimeout(ethereumTrader.start, 10 * 1000);
        setTimeout(dogeTrader.start, 20 * 1000);
        setTimeout(shibTrader.start, 30 * 1000);
        setTimeout(bittorentTrader.start, 40 * 1000);
    };
};
