require('dotenv').config;

const ccxt = require('ccxt');
const axios = require('axios');

const tick = async(config, binanceClient) => {
    const { asset, base, spread, allocation } =  config;
    const market = `${asset}/${base}`;

    // check Binance balance 
    // const balances = await binanceClient.fetchBalance();
    // console.log('Free asset (DOGE)', balances.free[asset]);
    // console.log('Free base (USDT)', balances.free[asset]);

    /** cancel previously scheduled (limit) orders for the market */
    const order = await binanceClient.fetchOpenOrders(market);
    order.forEach(async order => {
        await binanceClient.cancelOrder(order.id);
    });

    const coingeckoPrices = await Promise.all([
        axios.get(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD&ids=bitcoin&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        ),
        axios.get(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD&ids=dogecoin&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        ),
    ]);

    // console.log('Coingecko prices', coingeckoPrices[0].data[0], coingeckoPrices[1].data[0], coingeckoPrices[0].data[0].current_price, coingeckoPrices[1].data[0].current_price);

    const USD = coingeckoPrices[0].data[0].current_price;
    const DOGE = coingeckoPrices[1].data[0].current_price;

    console.log('USD', USD);
    console.log('DOGE', DOGE);

    /** calculate sell / buy orders */
    const marketPrice = USD / DOGE;

    const buyPrice = marketPrice * (1 - spread);
    const sellPrice = marketPrice * (1 + spread);

    const balances = await binanceClient.fetchBalance();
    const assetBalance = balances.free[asset];
    const baseBalance = balances.free[base];

    const sellVolume = assetBalance * allocation;
    const buyVolume = (baseBalance + allocation) / marketPrice;

    console.log(`
        Tick for ${market}...
        Limit sell order for ${sellVolume}@${sellPrice}
        Limit buy order for ${buyVolume}@${buyPrice}
    `);

    // await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
    // await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);
};

const run = () => {
    const config = {
        asset: 'DOGE',
        base: 'USDT',
        spread: 0.2,
        allocation: 0.1,
        tickInterval: 5000,
    };

    const binanceClient = new ccxt.binance({
        apiKey: 'hw28TMrYkJvLFYLTTPsGDBZH9MJOfVIwwaCCDFMktO3evJUQw6eokSLSp0X8T5u3', // TODO: process.env.API_KEY,
        secret: 'LA6DSgTlNDpPUOrfjDHjSyxNmU4bP20EY7pjQ5TyRZxFa1LhC0lApmR6RgIVAizt', // TODO: process.env.API_SECRET,
    });

    tick(config, binanceClient);

    // TODO: enable continous trading
    setInterval(tick, config.tickInterval, config, binanceClient);
};

/** invoke crypto trading bot */
run();