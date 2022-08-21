const ethereum = {
    base: 'BUSD',
    asset: 'ETH',
    buySpread: 0.05, // { 0-1 } asset price drop to trigger buy limit order
    sellSpread: 0.05, // { 0-1 } asset price rise to trigger sell limit order
    buyAllocation: 0.05, // { 0-1 } how much of the base balance to allocate for the buy order
    sellAllocation: 0.05, // { 0-1 } how much of the asset balance to allocate for the sell order
    minBuyOrderVolume: 500.00, // minimum BUY order volume to allocate in notional currency (BUSD)
    minSellOrderVolume: 500.00, // minimum SELL order volume to allocate in notional currency (BUSD)
    minSellOrdersToKeep: 1, // how many notional SELL orders always to keep (minSellOrderVolume * minSellOrdersToKeep)
    tickInterval: 60 * 1000, // ms
};


export default ethereum;
