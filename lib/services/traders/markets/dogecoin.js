const dogecoin = {
    base: 'BUSD',
    asset: 'DOGE',
    buySpread: 0.01, // { 0-1 } asset price drop to trigger buy limit order
    sellSpread: 0.01, // { 0-1 } asset price rise to trigger sell limit order
    buyAllocation: 0.05, // { 0-1 } how much of the base balance to allocate for the buy order
    sellAllocation: 0.10, // { 0-1 } how much of the asset balance to allocate for the sell order
    tickInterval: 60 * 1000, // ms
};


export default dogecoin;
