# crypto-trading-bot
Crypto trading bot for Binance

## Project Setup Guide

### Requirements
- `npm ^7.5.4.`
- `node ^15.10.0`
- `nodemon ^2.0.7`

### Build Setup
```bash
# copy .prod file
$ cp .env.prod .env

# install dependencies
$ npm install

# run trading bot
$ npm run start

# setup heroku deployment
$ heroku git:remote -a trading-bot-01
```

### Application entry point
> [index.js](https://github.com/driule/crypto-trading-bot/blob/main/index.js)
