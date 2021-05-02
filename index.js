const http = require('http');

require('dotenv').config;

const ccxt = require('ccxt');
const axios = require('axios');

const tick = async(config, binanceClient) => {
    var now = new Date();
    console.log('\n\n [!] starting new iteration...', now.toUTCString());

    const { asset, base, buySpread, sellSpread, buyAllocation, sellAllocation } =  config;
    const market = `${asset}/${base}`;

    // check Binance balance 
    // const balances = await binanceClient.fetchBalance();
    // console.log('Free asset (DOGE)', balances.free[asset]);
    // console.log('Free base (USDT)', balances.free[asset]);

    /** cancel previously scheduled (limit) orders for the market */
    const orders = await binanceClient.fetchOpenOrders(market);
    orders.forEach(async order => {
        console.log('order', order.id, `${asset}${base}`);
        await binanceClient.cancelOrder(order.id, market);
    });

    const coingeckoPrices = await Promise.all([
        axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=USD'
        ),
        axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=busd&vs_currencies=USD'
        ),
    ]);

    const USD_PER_BASE = coingeckoPrices[1].data.busd.usd;
    const USD_PER_ASSET = coingeckoPrices[0].data.dogecoin.usd;

    console.log('USD per DOGE', USD_PER_ASSET);
    console.log('USD per BUSD', USD_PER_BASE);

    /** 
     * calculate SELL & BUY orders
     * */
    const marketPrice = USD_PER_ASSET / USD_PER_BASE;
    console.log('market price', marketPrice);

    const buyPrice = marketPrice * (1 - buySpread);
    const sellPrice = marketPrice * (1 + sellSpread);

    /** availbale assets balance */
    const balances = await binanceClient.fetchBalance();
    const baseBalance = balances.free[base];
    const assetBalance = balances.free[asset];

    console.log('[BUSD] base balance', baseBalance);
    console.log('[DOGE] asset balance', assetBalance);

    const sellVolume = assetBalance * sellAllocation;
    const buyVolume = (baseBalance * buyAllocation) / marketPrice;

    const totalToBeSold = sellVolume * sellPrice; // of BUSD
    const totalToBeBought = buyVolume * buyPrice; // of BUSD

    console.log(`
        Tick for ${market}...
        Limit sell order for ${sellVolume} DOGE @ ${sellPrice} BUSD = ${totalToBeSold} BUSD
        Limit buy order for ${buyVolume} DOGE @ ${buyPrice} BUSD = ${totalToBeBought} BUSD
    `);

    // TODO: enable real trading if deal size is more than 10 USD
    if (totalToBeSold > 10) {
        console.log('[!] setting real sell order');
        await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
    }

    if (totalToBeBought > 10) {
        console.log('[!] setting real buy order');
        await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);
    }
};

const run = () => {
    const config = {
        asset: 'DOGE',
        base: 'BUSD',
        buySpread: 0.02, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
        sellSpread: 0.02, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
        buyAllocation: 0.25, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
        sellAllocation: 0.25, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
        tickInterval: 10 * 60 * 1000, // ms
    };

    const binanceClient = new ccxt.binance({
        apiKey: 'hw28TMrYkJvLFYLTTPsGDBZH9MJOfVIwwaCCDFMktO3evJUQw6eokSLSp0X8T5u3', // TODO: process.env.API_KEY,
        secret: 'LA6DSgTlNDpPUOrfjDHjSyxNmU4bP20EY7pjQ5TyRZxFa1LhC0lApmR6RgIVAizt', // TODO: process.env.API_SECRET,
    });

    tick(config, binanceClient);

    // TODO: enable continous trading
    setInterval(tick, config.tickInterval, config, binanceClient);
};

const hostname = '127.0.0.1';
const port = process.env.PORT || 3010;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
});

server.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);

    /** invoke crypto trading bot */
    run();
});