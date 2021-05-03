const ccxt = require('ccxt');
const axios = require('axios');

const MIN_ORDER_VOLUME = 10.0; // BUSD

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

        // enable continous trading
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
        const { asset, base, buySpread, sellSpread, buyAllocation, sellAllocation } = this.config;
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
        const balances = await this.binanceClient.fetchBalance();
        const baseBalance = balances.free[base];
        const assetBalance = balances.free[asset];

        console.log(`[${base}] base balance: ${baseBalance}`);
        console.log(`[${asset}] asset balance: ${assetBalance}`);

        /** calculate market price */
        const marketPrice = USD_PER_ASSET / USD_PER_BASE;
        console.log('[i] market price', this.round(marketPrice), USD_PER_ASSET, '/', USD_PER_BASE);

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
            console.log('[*]', order.side, order.amount, 'DOGE @', order.price, 'BUSD');
        }
        /** skip canceling when new orders cannot be created */
        if (openOrders.length === 2) {
            console.log('[>...] skipping, both orders are still open...');
            return;
        }
        if (totalToBeSold < MIN_ORDER_VOLUME) {
            console.log('[>...] skipping, sell order cannot be created', this.round(totalToBeSold));
            return;
        }
        if (totalToBeBought < MIN_ORDER_VOLUME) {
            console.log('[>...] skipping, buy order cannot be created', this.round(totalToBeBought));
            return;
        }

        /** cancel previously scheduled market limit orders */
        for (const order of openOrders) {
            console.log('[/] canceling order', order.id, market);
            if (this.isProduction()) {
                await this.binanceClient.cancelOrder(order.id, market);
            }
        }

        console.log(`
            [i] ${market} new market limit orders determined
            [+] Buy ${this.round(buyVolume)} @ ${this.round(buyPrice)} => ${this.round(totalToBeBought)} BUSD
            [-] Sell ${this.round(sellVolume)} @ ${this.round(sellPrice)} => ${this.round(totalToBeSold)} BUSD
        `);

        /** create new limit orders */
        if (this.isProduction()) {
            console.log('[!] creating limit sell order');
            await this.binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
        }

        if (this.isProduction()) {
            console.log('[!] creating limit buy order');
            await this.binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);
        }
    };
};

module.exports = {
    Trader: Trader
};
