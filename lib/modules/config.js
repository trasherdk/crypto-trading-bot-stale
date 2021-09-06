import dotenv from 'dotenv';

export default function config(app) {
    /** read .env file, parse the contents, assign it to: process.env. */
    dotenv.config();

    app.config = {
        env: process.env.ENV,
        port: process.env.PORT,
        api: {
            binance: {
                key: process.env.BINANCE_API_KEY,
                secret: process.env.BINANCE_API_SECRET,
            },
            lunar: {
                key: process.env.LUNAR_API_KEY,
            },
        },
    };
};
