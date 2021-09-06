const ADA = require('./traders/markets/cardano').cardano;
const ETH = require('./traders/markets/ethereum').ethereum;
const DOGE = require('./traders/markets/dogecoin').dogecoin;
const BTT = require('./traders/markets/btt').bittorrent;
const BTC = require('./traders/markets/bitcoin').bitcoin;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        /** order bots invoke execution */
        setTimeout((new BinanceTrader(ADA)).start, 1000);
        setTimeout((new BinanceTrader(ETH)).start, 10 * 1000);
        setTimeout((new BinanceTrader(DOGE)).start, 20 * 1000);
        setTimeout((new BinanceTrader(BTT)).start, 30 * 1000);
        setTimeout((new BinanceTrader(BTC)).start, 40 * 1000);
    };
};
