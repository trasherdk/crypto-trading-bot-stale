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
    buySpread: 0.05, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.05, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.2, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 60 * 1000, // ms
};


module.exports = {
    TRON: tronConfig,
};
