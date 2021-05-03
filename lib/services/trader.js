const BinanceTrader = require('./traders/binance').Trader;

const dogeConfig = {
    base: {
        id: 'busd',
        symbol: 'BUSD',
    },
    asset: {
        id: 'dogecoin',
        symbol: 'DOGE',
    },
    buySpread: 0.01, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.01, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.2, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 0.5 * 60 * 1000, // ms
};

module.exports = app => {

    module.exports.run = () => {
        const dogeTrader = new BinanceTrader(dogeConfig);
        dogeTrader.start();
    };
};
