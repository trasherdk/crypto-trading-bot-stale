import ccxt from 'ccxt';
import axios from 'axios';

/** of how many days to fetch closed orders */
const DAYS_TO_EVALUATE = 14;

const LUNAR_SPREAD_IMPACT = 0.25; // [0 <=> 10+]

/** value of LunarCRUSH middle score (no impact value) */
const LUNAR_CORRELATION_STANDPOINT = 2.5; // https://help.lunarcrush.com/en/articles/2717778-how-is-correlation-score-calculated

/** price spread multiplier to determine whether a new order placing is a good option after previous trade */
const DELTA_SPREAD_COEFFICIENT = 1.1;

/** percentage of how much order price can be different (lower|higher) than current asset price */
const MAX_PRICE_FLUCTUATION = 0.4;

export default class BinanceTrader {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        const { base, asset, buySpread, sellSpread, buyAllocation, sellAllocation, minBuyOrderVolume, minSellOrderVolume, minSellOrdersToKeep } = this.config;

        this.binanceClient = new ccxt.binance({
            apiKey: this.app.config.api.binance.key,
            secret: this.app.config.api.binance.secret,
            options: {
                adjustForTimeDifference: true,
            },
        });

        /** bot trading options */
        this.base = base;
        this.asset = asset;

        this.market = `${ this.asset }/${ this.base }`;

        this.buySpread = buySpread;
        this.buyAllocation = buyAllocation;
        this.minBuyOrderVolume = minBuyOrderVolume;

        this.sellSpread = sellSpread;
        this.sellAllocation = sellAllocation;
        this.minSellOrderVolume = minSellOrderVolume;
        this.minSellOrdersToKeep = minSellOrdersToKeep;

        /** market price ticker; mostly used { last, bid, ask } */
        this.price = null;

        /** Binance account balance */
        this.balance = null;
        this.baseBalance = null;
        this.assetBalance = null;

        this.openOrders = [];
        this.closedOrders = [];

        /** LunarCRUSH social data: various scores and ranking (https://lunarcrush.com/developers/docs) */
        this.lunarData = null;

        this.printStartupMessage();
    };

    start = () => {
        this.tick();

        // enable continuous trading
        setInterval(this.tick.bind(this), this.config.tickInterval);
    };

    tick = async () => {
        try {
            await Promise.all([
                this.fetchBalance(),
                this.fetchMarketPrice(),
                this.fetchOpenOrders(),
                this.fetchClosedOrders(DAYS_TO_EVALUATE),
                this.fetchLunarData(),
            ]);
        } catch (e) {
            console.error(`[${ this.market }] ERROR! Failed to fetch market data.`, e);
            return;
        }

        this.printIterationInfo();

        /** determine if buying is a good option */
        const buyOrder = this.getBuyOrder();
        if (this.shouldBuy(buyOrder)) {
            try {
                await this.cancelOrders('buy');
                await this.createBuyOrder(buyOrder);
            } catch (e) {
                console.error(`[${ this.market }] ERROR! Failed to place BUY order.`, e);
            }
        }

        /** determine if selling is a good option */
        const sellOrder = this.getSellOrder();
        if (this.shouldSell(sellOrder)) {
            try {
                await this.cancelOrders('sell');
                await this.createSellOrder(sellOrder);
            } catch (e) {
                console.error(`[${ this.market }] ERROR! Failed to place SELL order.`, e);
            }
        }
    };

    shouldBuy = (order) => {
        if (order.totalToBeBought > this.baseBalance) {
            console.log(`[${ this.market }] [...] base balance is too low ${ this.baseBalance }`);
            return false;
        }

        const sellOpenOrder = this.getOpenOrder('sell');
        if (sellOpenOrder !== null && order.buyPrice > sellOpenOrder.price) {
            console.log(`[${ this.market }] [...] buy price ${ order.buyPrice } is higher than sell ${ sellOpenOrder.price }`);
            return false;
        }

        const buyOpenOrder = this.getOpenOrder('buy');
        if (buyOpenOrder !== null) {

            /** allow BUY order when the last SELL price was high enough */
            if (this.closedOrders.length > 0) {
                let lastBuyOrder = this.getLastClosedOrder('buy');
                let lastSellOrder = this.getLastClosedOrder('sell');
                if (lastBuyOrder !== null && lastSellOrder !== null) {
                    // difference between last closed SELL order & new BUY order
                    const delta1 = (lastSellOrder.price - order.buyPrice) / order.buyPrice;

                    // difference between new BUY order & currently open BUY order
                    const delta2 = Math.abs((order.buyPrice - buyOpenOrder.price) / order.buyPrice);

                    // difference between last BUY order & new BUY order
                    const delta3 = Math.abs((lastBuyOrder.price - order.buyPrice) / order.buyPrice);

                    // difference between current bid price & new BUY price
                    const delta4 = Math.abs((this.price.bid - order.buyPrice) / order.buyPrice);

                    const spread = this.getBuySpread() * DELTA_SPREAD_COEFFICIENT;
                    // console.log(`[${ this.market }] [?] shouldBuy() spread: ${ spread }, delta1: ${ delta1 }, delta2: ${ delta2 }, delta3: ${ delta3 }, delta4: ${ delta4 }`, order.buyPrice, buyOpenOrder.price, lastBuyOrder.price, lastSellOrder.price);
                    if (delta1 > spread && delta2 > spread && delta3 > spread && delta4 < MAX_PRICE_FLUCTUATION) {
                        console.log(`[${ this.market }] [!] successful SELL order determined ${ lastSellOrder.amount } @ ${ lastSellOrder.price }`);
                        return true;
                    }
                }
            }

            console.log(`[${ this.market }] [...] buy order is still open`);
            return false;
        }

        return true;
    };

    shouldSell = (order) => {
        if (order.sellVolume > this.assetBalance) {
            console.log(`[${ this.market }] [...] asset balance is too low ${ this.assetBalance }`);
            return false;
        }

        const buyOpenOrder = this.getOpenOrder('buy');
        if (buyOpenOrder !== null && order.sellPrice < buyOpenOrder.price) {
            console.log(`[${ this.market }] [...] sell price ${ order.sellPrice } is lower than buy ${ buyOpenOrder.price }`);
            return false;
        }

        /** minimum amount of asset balance to preserve (always keep some crypto, don't sell everything) */
        const bareAssetMinimum = (this.minSellOrderVolume / this.price.ask) * this.minSellOrdersToKeep;
        if (this.assetBalance < bareAssetMinimum) {
            console.log(`[${ this.market }] [...] actual asset balance balance ${ this.assetBalance } is lower than bare minimum ${ this.round(bareAssetMinimum) }`);
            return false;
        }

        const sellOpenOrder = this.getOpenOrder('sell');
        if (sellOpenOrder !== null) {

            /** allow SELL order when the last BUY price was low enough */
            if (this.closedOrders.length > 0) {
                let lastBuyOrder = this.getLastClosedOrder('buy');
                let lastSellOrder = this.getLastClosedOrder('sell');
                if (lastBuyOrder !== null && lastSellOrder !== null) {
                    // difference between new SELL order & last closed BUY order
                    const delta1 = (order.sellPrice - lastBuyOrder.price) / order.sellPrice;

                    // difference between currently open SELL order & new SELL order
                    const delta2 = Math.abs((sellOpenOrder.price - order.sellPrice) / order.sellPrice);

                    // difference between new SELL order & last SELL order
                    const delta3 = Math.abs((order.sellPrice - lastSellOrder.price) / order.sellPrice);

                    // difference between current ask price & new SELL price
                    const delta4 = Math.abs((this.price.ask - order.sellPrice) / order.sellPrice);

                    const spread = this.getSellSpread() * DELTA_SPREAD_COEFFICIENT;
                    // console.log(`[${ this.market }] [?] shouldSell() spread: ${ spread }, delta1: ${ delta1 }, delta2: ${ delta2 }, delta3: ${ delta3 }, delta4: ${ delta4 }`, order.sellPrice, sellOpenOrder.price, lastBuyOrder.price, lastSellOrder.price);
                    if (delta1 > spread && delta2 > spread && delta3 > spread && delta4 < MAX_PRICE_FLUCTUATION) {
                        console.log(`[${ this.market }] [!] successful BUY order determined ${ lastBuyOrder.amount } @ ${ lastBuyOrder.price }`);
                        return true;
                    }
                }
            }

            console.log(`[${ this.market }] [...] sell order is still open`);
            return false;
        }

        return true;
    };

    getBuyOrder = () => {
        const buyPrice = this.price.bid * (1 - this.getBuySpread());

        let lunarImpact = 1;
        if (this.lunarData !== null) {
            lunarImpact = this.lunarData.correlation_rank / LUNAR_CORRELATION_STANDPOINT;
        }
        let buyVolume = ((this.baseBalance * this.buyAllocation) / this.price.bid) * lunarImpact;
        let totalToBeBought = buyVolume * buyPrice;

        /** calculate at least minimum buy order: increase volume */
        if (totalToBeBought < this.minBuyOrderVolume) {
            totalToBeBought = this.minBuyOrderVolume;
            buyVolume = totalToBeBought / buyPrice;
        }

        return { buyPrice, buyVolume, totalToBeBought };
    };

    getSellOrder = () => {
        const sellPrice = this.price.ask * (1 + this.getSellSpread());

        let lunarImpact = 1;
        if (this.lunarData !== null) {
            lunarImpact = 1 / (this.lunarData.correlation_rank / LUNAR_CORRELATION_STANDPOINT);
        }
        let sellVolume = (this.assetBalance * this.sellAllocation) * lunarImpact;
        let totalToBeSold = sellVolume * sellPrice;

        /** calculate at least minimum sell order: increase volume */
        if (totalToBeSold < this.minSellOrderVolume) {
            totalToBeSold = this.minSellOrderVolume;
            sellVolume = totalToBeSold / sellPrice;
        }

        return { sellPrice, sellVolume, totalToBeSold };
    };

    getBuySpread = () => {
        // if (this.lunarData !== null) {
        //     const lunarMultiplier = 1 / LUNAR_SPREAD_IMPACT;

        //     return (this.buySpread * lunarMultiplier + this.lunarData.volatility) / (1 + lunarMultiplier);
        // }

        return this.buySpread;
    };

    getSellSpread = () => {
        // if (this.lunarData !== null) {
        //     const lunarMultiplier = 1 / LUNAR_SPREAD_IMPACT;

        //     return (this.sellSpread * lunarMultiplier + this.lunarData.volatility) / (1 + lunarMultiplier);
        // }

        return this.sellSpread;
    };

    createBuyOrder = async (order) => {
        if (order.totalToBeBought >= this.minBuyOrderVolume && this.isProduction()) {
            console.log(`[${ this.market }] [!] [+] buying ${ this.round(order.buyVolume) } ${ this.asset } @ ${ this.round(order.buyPrice) } => ${ this.round(order.totalToBeBought) } ${ this.base }`);
            await this.binanceClient.createLimitBuyOrder(this.market, order.buyVolume, order.buyPrice);
        } else {
            console.warn(`[${ this.market }] WARNING! Failed to create BUY order: ${ this.round(order.buyVolume) } ${ this.asset } @ ${ this.round(order.buyPrice) } => ${ this.round(order.totalToBeBought) } ${ this.base }`);
        }
    };

    createSellOrder = async (order) => {
        if (order.totalToBeSold >= this.minSellOrderVolume && this.isProduction()) {
            console.log(`[${ this.market }] [!] [-] selling ${ this.round(order.sellVolume) } ${ this.asset } @ ${ this.round(order.sellPrice) } => ${ this.round(order.totalToBeSold) } ${ this.base }`);
            await this.binanceClient.createLimitSellOrder(this.market, order.sellVolume, order.sellPrice);
        } else {
            console.warn(`[${ this.market }] WARNING! Failed to create SELL order: ${ this.round(order.sellVolume) } ${ this.asset } @ ${ this.round(order.sellPrice) } => ${ this.round(order.totalToBeSold) } ${ this.base }`);
        }
    };

    cancelOrders = async (side = null) => {
        for (const order of this.openOrders) {
            if ((side === order.side || side === null) && this.isProduction()) {
                console.log(`[${ this.market }] [!] [/] canceling order`, order.id, order.status, order.side, order.amount, this.asset, '@', order.price, this.base);
                await this.binanceClient.cancelOrder(order.id, this.market);
            }
        }
    };

    fetchBalance = async () => {
        this.balance = await this.binanceClient.fetchBalance();
        this.baseBalance = this.balance.free[this.base];
        this.assetBalance = this.balance.free[this.asset];
    };

    fetchMarketPrice = async () => {
        this.price = await this.binanceClient.fetchTicker(this.market);
    };

    fetchOpenOrders = async () => {
        this.openOrders = await this.binanceClient.fetchOpenOrders(this.market);
    };

    fetchClosedOrders = async (days) => {
        const since = this.binanceClient.milliseconds() - days * 86400 * 1000; // 7 days
        this.closedOrders = await this.binanceClient.fetchClosedOrders(this.market, since);
    };

    fetchLunarData = async () => {
        await axios.get(
            `https://api.lunarcrush.com/v2?data=assets&key=${ this.app.config.api.lunar.key }&symbol=${ this.asset }&data_points=0`
        ).then((response) => {
            this.lunarData = response.data.data[0];
        }).catch((error) => {
            console.warn(`[${ this.market }] WARNING! Failed to fetch LunarCRUSH data.`, error);
        });
    };

    getLastClosedOrder = (side) => {
        for (let i = this.closedOrders.length - 1; i >= 0; i--) {
            if (this.closedOrders[i].side === side) {
                return this.closedOrders[i];
            }
        }
        return null;
    }

    getOpenOrder = (side) => {
        for (const order of this.openOrders) {
            if (order.side === side) {
                return order;
            }
        }
        return null;
    };

    isProduction = () => {
        return this.app.config.env === 'prod';
    };

    /** mainly used for printing */
    round = (n) => {
        return Math.round(n * 100000) / 100000;
    };

    printStartupMessage = () => {
        console.log(`
            [${ this.market }] Launching bot...
                - buy spread: ${ this.buySpread }
                - buy allocation: ${ this.buyAllocation }
                - sell spread: ${ this.sellSpread }
                - sell allocation: ${ this.sellAllocation }
                - min BUY order volume: ${ this.minBuyOrderVolume }
                - min SELL order volume: ${ this.minSellOrderVolume }
                - min SELL orders to always keep: ${ this.minSellOrdersToKeep }
        `);
    };

    printIterationInfo = () => {
        console.log(`[${ this.market }] <<<<<<<<<< ${ (new Date()).toUTCString() } >>>>>>>>>>`);
        console.log(`[${ this.market }] [$] base ${ this.baseBalance }`);
        console.log(`[${ this.market }] [$] asset ${ this.assetBalance }`);
        console.log(`[${ this.market }] [~] price ${ this.price.last }`);
        console.log(`[${ this.market }] [i] volatility ${ this.lunarData !== null ? this.lunarData.volatility : 'N/A' }`);
        console.log(`[${ this.market }] [i] LunarCRUSH correlation ${ this.lunarData !== null ? this.lunarData.correlation_rank : 'N/A' }`);
        for (const order of this.openOrders) {
            console.log(
                `[${ this.market }] [i]`,
                order.side,
                order.amount,
                this.asset,
                '@',
                order.price,
                '=>',
                this.round(order.amount * order.price),
                this.base
            );
        }
    };
};
