const winston = require('winston');

module.exports = (err, req, res, next) => {
    winston.error('error', err.message);

    res.status(500).send('Something failed.');
}