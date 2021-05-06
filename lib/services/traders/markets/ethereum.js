const config = {
    currency: 'usd',
    base: {
        id: 'tether',
        symbol: 'USDT',
    },
    asset: {
        id: 'ethereum',
        symbol: 'ETH',
    },
    buySpread: 0.07, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.06, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.14, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.12, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 60 * 1000, // ms
};


module.exports = {
    ethereum: config,
};
