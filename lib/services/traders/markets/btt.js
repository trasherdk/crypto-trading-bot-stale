const bttConfig = {
    currency: 'usd',
    base: {
        id: 'usd-coin',
        symbol: 'USDC',
    },
    asset: {
        id: 'bittorrent-2',
        symbol: 'BTT',
    },
    buySpread: 0.1, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
    sellSpread: 0.1, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
    buyAllocation: 0.2, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
    tickInterval: 60 * 1000, // ms
};

module.exports = {
    BTT: bttConfig,
};
