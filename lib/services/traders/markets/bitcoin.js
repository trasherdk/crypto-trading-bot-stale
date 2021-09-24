const bitcoin = {
    base: 'BUSD',
    asset: 'BTC',
    buySpread: 0.02, // { 0-1 } asset price drop to trigger buy limit order
    sellSpread: 0.02, // { 0-1 } asset price rise to trigger sell limit order
    buyAllocation: 0.075, // { 0-1 } how much of the base balance to allocate for the buy order
    sellAllocation: 0.1176, // { 0-1 } how much of the asset balance to allocate for the sell order | minSellOrderVolume / ((minSellOrdersToKeep + 1) * minSellOrderVolume)
    minBuyOrderVolume: 12.50, // minimum BUY order volume to allocate in notional currency (BUSD)
    minSellOrderVolume: 11.00, // minimum SELL order volume to allocate in notional currency (BUSD)
    minSellOrdersToKeep: 7.5, // how many notional SELL orders always to keep (minSellOrderVolume * minSellOrdersToKeep)
    tickInterval: 60 * 1000, // ms
};


export default bitcoin;
