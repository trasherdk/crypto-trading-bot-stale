/** read .env file, parse the contents, assign it to process.env */
require('dotenv').config();

module.exports = app => {
    app.config = {
        env: process.env.ENV,
        port: process.env.PORT,
        API: {
            key: process.env.API_KEY,
            secret: process.env.API_SECRET,
        },
    }
};
