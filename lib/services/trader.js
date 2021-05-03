const ccxt = require('ccxt');
const axios = require('axios');

const MIN_ORDER_VOLUME = 10.0; // BUSD

module.exports = app => {

    const isProduction = () => {
        return app.config.env === 'prod';
    };

    module.exports.run = () => {
        const config = {
            asset: 'DOGE',
            base: 'BUSD',
            buySpread: 0.02, // { 0-1 } percentage of asset price fluctuation to trigger buy limit order
            sellSpread: 0.02, // { 0-1 } percentage of asset price fluctuation to trigger sell limit order
            buyAllocation: 0.25, // { 0-1 } percentage of how much of the base balance to allocate for the buy order
            sellAllocation: 0.25, // { 0-1 } percentage of how much of the asset balance to allocate for the sell order
            tickInterval: 0.5 * 60 * 1000, // ms
        };

        const binanceClient = new ccxt.binance({
            apiKey: app.config.API.key,
            secret: app.config.API.secret,
        });

        tick(config, binanceClient);

        // TODO: enable continous trading
        setInterval(tick, config.tickInterval, config, binanceClient);
    };

    const tick = async (config, binanceClient) => {
        const {asset, base, buySpread, sellSpread, buyAllocation, sellAllocation} = config;
        const market = `${asset}/${base}`;

        console.log('\n\n [>>>>>>>>>>]', market, (new Date()).toUTCString(), '\n');

        /** fetch market prices based on USD */
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

        /** check available Binance balances */
        const balances = await binanceClient.fetchBalance();
        const baseBalance = balances.free[base];
        const assetBalance = balances.free[asset];

        console.log(`[${base}] base balance: ${baseBalance}`);
        console.log(`[${asset}] asset balance: ${assetBalance}`);

        /** calculate market price */
        const marketPrice = USD_PER_ASSET / USD_PER_BASE;
        console.log('');
        console.log('Market price:', marketPrice, USD_PER_ASSET, '/', USD_PER_BASE);

        /** determine buy & sell prices */
        const buyPrice = marketPrice * (1 - buySpread);
        const sellPrice = marketPrice * (1 + sellSpread);

        /** determine buy & sell volumes */
        const sellVolume = assetBalance * sellAllocation;
        const buyVolume = (baseBalance * buyAllocation) / marketPrice;

        const totalToBeSold = sellVolume * sellPrice; // of BUSD
        const totalToBeBought = buyVolume * buyPrice; // of BUSD

        /** evaluate open market limit orders */
        const openOrders = await binanceClient.fetchOpenOrders(market);

        console.log('\nOpen orders:');
        for (const order of openOrders) {
            console.log('[*]', order.side, order.amount, 'DOGE @', order.price, 'BUSD');
        }
        /** skip canceling when new orders cannot be created */
        if (openOrders.length === 2) {
            console.log('[<>] skipping, both orders are still open...');
            return;
        }
        if (totalToBeSold < MIN_ORDER_VOLUME) {
            console.log('[<>] skipping, sell order cannot be created');
            return;
        }
        if (totalToBeBought < MIN_ORDER_VOLUME) {
            console.log('[<>] skipping, buy order cannot be created');
            return;
        }

        /** cancel previously scheduled market limit orders */
        for (const order of openOrders) {
            console.log('[/] canceling order', order.id, market);
            if (isProduction()) {
                await binanceClient.cancelOrder(order.id, market);
            }
        }

        console.log(`
            ${market} new market limit orders:
            [+] Buy ${buyVolume} @ ${buyPrice} => ${totalToBeBought} BUSD
            [-] Sell ${sellVolume} @ ${sellPrice} => ${totalToBeSold} BUSD
        `);

        /** create new limit orders */
        if (isProduction()) {
            console.log('[!] creating limit sell order');
            await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
        }

        if (isProduction()) {
            console.log('[!] creating limit buy order');
            await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);
        }
    };
};
