const ccxt = require('ccxt');
const axios = require('axios');

const TYPICAL_ORDERS_COUNT = 2; // one SELL + one BUY
const MIN_ORDER_VOLUME = 10.00; // BUSD

class Trader {
    constructor(config) {
        this.config = config;
        const {currency, base, asset, buySpread, sellSpread, buyAllocation, sellAllocation} = this.config;

        this.binanceClient = new ccxt.binance({
            apiKey: process.env.API_KEY,
            secret: process.env.API_SECRET,
        });

        /** bot trading options */
        this.base = base;
        this.asset = asset;
        this.currency = currency;

        this.market = `${ this.asset.symbol }/${ this.base.symbol }`;

        this.buySpread = buySpread;
        this.buyAllocation = buyAllocation;

        this.sellSpread = sellSpread;
        this.sellAllocation = sellAllocation;

        /** based on this.currency */
        this.basePrice = null;
        this.assetPrice = null;
        this.marketPrice = null;

        /** Binance account balance */
        this.balance = null;
        this.baseBalance = null;
        this.assetBalance = null;

        this.openOrders = [];

        this.printStartupMessage();
    };

    start = () => {
        this.tick();

        // enable continuous trading
        setInterval(this.tick.bind(this), this.config.tickInterval);
    };

    tick = async () => {
        await Promise.all([
            this.fetchBalance(),
            this.fetchOpenOrders(),
            this.fetchMarketPrices(),
        ]);

        this.printIterationInfo();

        if (this.openOrders.length >= TYPICAL_ORDERS_COUNT) {
            console.log(`[${ this.market }] [...] orders are still open`);
            return false;
        }

        /** determine if buying is a good option */
        const buyOrder = this.getBuyOrder();
        if (this.shouldBuy(buyOrder)) {
            await this.cancelOrders('buy');
            await this.createBuyOrder(buyOrder);
        }

        /** determine if selling is a good option */
        const sellOrder = this.getSellOrder();
        if (this.shouldSell(sellOrder)) {
            await this.cancelOrders('sell');
            await this.createSellOrder(sellOrder);
        }
    };

    shouldBuy = (order) => {
        if (this.isOrderOpen('buy')) {
            console.log(`[${ this.market }] [...] buy order is still open`);
            return false;
        }

        if (order.totalToBeBought < MIN_ORDER_VOLUME) {
            console.log(`[${ this.market }] [...] buy order of ${ this.round(order.totalToBeBought) } cannot be created`);
            return false;
        }

        const sellOpenOrder = this.getOpenOrder('sell');

        // TODO: start checking previously completed orders
        if (sellOpenOrder !== null && order.buyPrice > sellOpenOrder.price) {
            console.log(`[${ this.market }] [...] buy price ${ order.buyPrice } is higher than sell ${ sellOpenOrder.price }`);
            return false;
        }

        return true;
    };

    shouldSell = (order) => {
        if (this.isOrderOpen('sell')) {
            console.log(`[${ this.market }] [...] sell order is still open`);
            return false;
        }

        if (order.totalToBeSold < MIN_ORDER_VOLUME) {
            console.log(`[${ this.market }] [...] sell order of ${ this.round(order.totalToBeSold) } cannot be created`);
            return false;
        }

        const buyOpenOrder = this.getOpenOrder('buy');

        // TODO: start checking previously completed orders
        if (buyOpenOrder !== null && order.sellPrice < buyOpenOrder.price) {
            console.log(`[${ this.market }] [...] sell price ${ order.sellPrice } is lower than buy ${ buyOpenOrder.price }`);
            return false;
        }

        return true;
    };

    getBuyOrder = () => {
        const buyPrice = this.marketPrice * (1 - this.buySpread);
        const buyVolume = (this.baseBalance * this.buyAllocation) / this.marketPrice;
        const totalToBeBought = buyVolume * buyPrice; // of currency

        return {buyPrice, buyVolume, totalToBeBought};
    };

    getSellOrder = () => {
        const sellPrice = this.marketPrice * (1 + this.sellSpread);
        const sellVolume = this.assetBalance * this.sellAllocation;
        const totalToBeSold = sellVolume * sellPrice; // of currency

        return {sellPrice, sellVolume, totalToBeSold};
    };

    createBuyOrder = async (order) => {
        if (order.totalToBeBought > MIN_ORDER_VOLUME && this.isProduction()) {
            console.log(`[${ this.market }] [!] [+] buying ${ this.round(order.buyVolume) } ${ this.asset.symbol } @ ${ this.round(order.buyPrice) } => ${ this.round(order.totalToBeBought) } ${ this.base.symbol }`);
            await this.binanceClient.createLimitBuyOrder(this.market, order.buyVolume, order.buyPrice);
        }
    };

    createSellOrder = async (order) => {
        if (order.totalToBeSold > MIN_ORDER_VOLUME && this.isProduction()) {
            console.log(`[${ this.market }] [!] [-] selling ${ this.round(order.sellVolume) } ${ this.asset.symbol } @ ${ this.round(order.sellPrice) } => ${ this.round(order.totalToBeSold) } ${ this.base.symbol }`);
            await this.binanceClient.createLimitSellOrder(this.market, order.sellVolume, order.sellPrice);
        }
    };

    cancelOrders = async (side = null) => {
        for (const order of this.openOrders) {
            if (side === order.side && this.isProduction() || side === null) {
                console.log(`[${ this.market }] [!] [/] canceling order`, order.id, order.status, order.side, order.amount, this.asset.symbol, '@', order.price, this.base.symbol);
                await this.binanceClient.cancelOrder(order.id, this.market);
            }
        }
    };

    fetchBalance = async () => {
        this.balance = await this.binanceClient.fetchBalance();
        this.baseBalance = this.balance.free[this.base.symbol];
        this.assetBalance = this.balance.free[this.asset.symbol];
    };

    fetchMarketPrices = async () => {
        const coingeckoPrices = await Promise.all([
            axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ this.base.id }&vs_currencies=${ this.currency }`
            ),
            axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ this.asset.id }&vs_currencies=${ this.currency }`
            ),
        ]).catch((error) => {
            console.log(`[${ this.market }] ERROR! ${ error }`);
        });

        this.basePrice = coingeckoPrices[0].data[this.base.id][this.currency];
        this.assetPrice = coingeckoPrices[1].data[this.asset.id][this.currency];
        this.marketPrice = this.assetPrice / this.basePrice;
    };

    fetchOpenOrders = async () => {
        this.openOrders = await this.binanceClient.fetchOpenOrders(this.market);
    };

    isOrderOpen = (side) => {
        for (const order of this.openOrders) {
            if (order.side === side) {
                return true;
            }
        }
        return false;
    };

    getOpenOrder = (side) => {
        for (const order of this.openOrders) {
            if (order.side === side) {
                return order;
            }
        }
        return null;
    };

    isProduction = () => {
        return process.env.ENV === 'prod';
    };

    /** mainly used for printing */
    round = (n) => {
        return Math.round(n * 10000) / 10000;
    };

    printStartupMessage = () => {
        console.log(`
            [${ this.market }] Launching bot...
                - buy spread: ${ this.buySpread }
                - buy allocation: ${ this.buyAllocation }
                - sell spread: ${ this.sellSpread }
                - sell allocation: ${ this.sellAllocation }
        `);
    };

    printIterationInfo = () => {
        console.log(`[${ this.market }] >>>>>>>>>> ${ (new Date()).toUTCString() }`);
        console.log(`[${ this.market }] [$] base ${ this.baseBalance }`);
        console.log(`[${ this.market }] [$] asset ${ this.assetBalance }`);
        console.log(`[${ this.market }] [~] market price ${ this.round(this.marketPrice) }`);
        for (const order of this.openOrders) {
            console.log(`[${ this.market }] [i]`, order.side, order.amount, this.asset.symbol, '@', order.price, this.base.symbol);
        }
    };
};

module.exports = {
    Trader: Trader
};
