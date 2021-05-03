module.exports = app => {
    app.get('/', (request, response) => {
        // console.log(request);
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain');
        response.end('OK');
    });
};
