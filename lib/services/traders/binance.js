const ccxt = require('ccxt');
const axios = require('axios');

const MIN_ORDER_VOLUME = 10.00; // BUSD

class Trader {
    constructor(config) {
        this.config = config;
        this.binanceClient = new ccxt.binance({
            apiKey: process.env.API_KEY,
            secret: process.env.API_SECRET,
        });
    };

    start = () => {
        this.tick();

        // enable continuous trading
        setInterval(this.tick.bind(this), this.config.tickInterval);
    };

    isProduction = () => {
        return process.env.ENV === 'prod';
    };

    /** mainly used for printing */
    round = (n) => {
        return Math.round(n * 10000) / 10000;
    };

    tick = async () => {
        const { currency, base, asset, buySpread, sellSpread, buyAllocation, sellAllocation } = this.config;
        const market = `${asset.symbol}/${base.symbol}`;

        console.log('\n\n [>>>>>>>>>>]', market, (new Date()).toUTCString(), '\n');

        /** fetch market prices */
        const coingeckoPrices = await Promise.all([
            axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${base.id}&vs_currencies=${currency}`
            ),
            axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=${currency}`
            ),
        ]);

        const basePrice = coingeckoPrices[0].data[base.id][currency]; // USD
        const assetPrice = coingeckoPrices[1].data[asset.id][currency]; // USD

        /** check available Binance balances */
        const balances = await this.binanceClient.fetchBalance();
        const baseBalance = balances.free[base.symbol];
        const assetBalance = balances.free[asset.symbol];

        console.log(`[${base.symbol}] base balance: ${baseBalance}`);
        console.log(`[${asset.symbol}] asset balance: ${assetBalance}`);

        /** calculate market price */
        const marketPrice = assetPrice / basePrice;
        console.log('[i] market price', this.round(marketPrice), assetPrice, '/', basePrice);

        /** determine buy & sell prices */
        const buyPrice = marketPrice * (1 - buySpread);
        const sellPrice = marketPrice * (1 + sellSpread);

        /** determine buy & sell volumes */
        const sellVolume = assetBalance * sellAllocation;
        const buyVolume = (baseBalance * buyAllocation) / marketPrice;

        const totalToBeSold = sellVolume * sellPrice; // of BUSD
        const totalToBeBought = buyVolume * buyPrice; // of BUSD

        /** evaluate open market limit orders */
        const openOrders = await this.binanceClient.fetchOpenOrders(market);

        console.log('[i] open orders');
        for (const order of openOrders) {
            console.log('[*]', order.side, order.amount, asset.symbol, '@', order.price, base.symbol);
        }

        /** skip when new orders cannot be created */
        if (openOrders.length === 2) {
            console.log('[>...] skipping, both orders are still open...');
            return;
        }
        if (openOrders.length > 0 && totalToBeSold < MIN_ORDER_VOLUME) {
            console.log('[>...] skipping, sell order cannot be created', this.round(totalToBeSold));
            return;
        }
        if (openOrders.length > 0 && totalToBeBought < MIN_ORDER_VOLUME) {
            console.log('[>...] skipping, buy order cannot be created', this.round(totalToBeBought));
            return;
        }

        /** cancel previously scheduled orders */
        for (const order of openOrders) {
            console.log('[/] canceling order', order.id, order.status, order.side, order.amount, asset.symbol, '@', order.price, base.symbol);
            if (this.isProduction()) {
                await this.binanceClient.cancelOrder(order.id, market);
            }
        }

        console.log(`
            [i] ${market} new market limit orders determined
            [+] Buy ${this.round(buyVolume)} @ ${this.round(buyPrice)} => ${this.round(totalToBeBought)} ${base.symbol}
            [-] Sell ${this.round(sellVolume)} @ ${this.round(sellPrice)} => ${this.round(totalToBeSold)} ${base.symbol}
        `);

        /** create new limit orders */
        if (this.isProduction() && totalToBeSold > MIN_ORDER_VOLUME) {
            console.log('[!] creating limit sell order');
            await this.binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
        }

        if (this.isProduction() && totalToBeBought > MIN_ORDER_VOLUME) {
            console.log('[!] creating limit buy order');
            await this.binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);
        }
    };
};

module.exports = {
    Trader: Trader
};
