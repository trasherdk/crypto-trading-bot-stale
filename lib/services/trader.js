const DOGE = require('./traders/markets/dogecoin').dogecoin;
// const BTC = require('./traders/markets/bitcoin').bitcoin;
const ETH = require('./traders/markets/ethereum').ethereum;
const BTT = require('./traders/markets/btt').bittorrent;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        const dogeTrader = new BinanceTrader(DOGE);
        // const bitcoinTrader = new BinanceTrader(BTC);
        const ethereumTrader = new BinanceTrader(ETH);
        const bittorentTrader = new BinanceTrader(BTT);

        /** order bots invoke execution */
        setTimeout(dogeTrader.start, 1000);
        // setTimeout(bitcoinTrader.start, 10 * 1000);
        setTimeout(ethereumTrader.start, 20 * 1000);
        setTimeout(bittorentTrader.start, 30 * 1000);
    };
};
