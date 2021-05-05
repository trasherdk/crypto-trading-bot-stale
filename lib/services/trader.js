const BinanceTrader = require('./traders/binance').Trader;

const dogeConfig = {
    currency: 'usd',
    base: {
        id: 'busd',
        symbol: 'BUSD',
    },
    asset: {
        id: 'dogecoin',
        symbol: 'DOGE',
    },
    buySpread: 0.035, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.025, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.25, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 0.5 * 60 * 1000, // ms
};

const tronConfig = {
    currency: 'usd',
    base: {
        id: 'tether',
        symbol: 'USDT',
    },
    asset: {
        id: 'tron',
        symbol: 'TRX',
    },
    buySpread: 0.035, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.025, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.25, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 0.5 * 60 * 1000, // ms
};

module.exports = app => {

    module.exports.run = () => {
        const dogeTrader = new BinanceTrader(dogeConfig);
        const tronTrader = new BinanceTrader(tronConfig);

        /** nicely order bots execution */
        setTimeout(dogeTrader.start, 0);
        setTimeout(tronTrader.start, 15 * 1000);
    };
};
