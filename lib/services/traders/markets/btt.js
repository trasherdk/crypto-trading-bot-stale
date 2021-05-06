const config = {
    currency: 'usd',
    base: {
        id: 'usd-coin',
        symbol: 'USDC',
    },
    asset: {
        id: 'bittorrent-2',
        symbol: 'BTT',
    },
    buySpread: 0.1, // { 0-1 } asset price drop to trigger buy limit order
    sellSpread: 0.1, // { 0-1 } asset price rise to trigger sell limit order
    buyAllocation: 0.2, // { 0-1 } how much of the base balance to allocate for the buy order
    sellAllocation: 0.2, // { 0-1 } how much of the asset balance to allocate for the sell order
    tickInterval: 60 * 1000, // ms
};

module.exports = {
    bittorrent: config,
};
