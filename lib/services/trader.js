const BTC = require('./traders/markets/bitcoin').bitcoin;
const ETH = require('./traders/markets/ethereum').ethereum;
const ADA = require('./traders/markets/cardano').cardano;
const DOGE = require('./traders/markets/dogecoin').dogecoin;
const BTT = require('./traders/markets/btt').bittorrent;
const SHIB = require('./traders/markets/shib').shib;

const BinanceTrader = require('./traders/binance').Trader;

module.exports = app => {

    module.exports.run = () => {
        /** order bots invoke execution */
        setTimeout((new BinanceTrader(BTC)).start, 1000);
        setTimeout((new BinanceTrader(ETH)).start, 10 * 1000);
        setTimeout((new BinanceTrader(ADA)).start, 20 * 1000);
        setTimeout((new BinanceTrader(DOGE)).start, 30 * 1000);
        setTimeout((new BinanceTrader(BTT)).start, 40 * 1000);
        setTimeout((new BinanceTrader(SHIB)).start, 50 * 1000);
    };
};
