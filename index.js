require('dotenv').config();
const logger = require('./config/winston');
const morganMiddleware = require("./config/morgan.middleware");
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const allowedOrigins = process.env.ADDRESSES_ALLOWED?.split(",") || [];

const app = express();

app.use(morganMiddleware);

app.use(cors({
    origin: function (origin, callback) {
        // const dateRequest = new Date().toISOString();
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // console.log(`${dateRequest}: not allowed from ${origin}`)
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true); amara
    }
}));

app.use(express.json({ limit: '100mb' }));//to accept json

const PORT = process.env.PORT || 6065;

app.use(function (req, res, next) {
    req._requestid = uuidv4();
    next();
});

// app.use(require('morgan')({ "stream": logger.stream }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/person', require('./routes/person'));
app.use('/api/channel', require('./routes/channel'));
app.use('/api/ticket', require('./routes/ticket'));
app.use('/api/main', require('./routes/main'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/load', require('./routes/load'));
app.use('/api/flow', require('./routes/flow'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/reportdesigner', require('./routes/reportdesigner'));
app.use('/api/event-booking', require('./routes/eventbooking'));
app.use('/api/user', require('./routes/user'));
app.use('/api/check', require('./routes/check'));
app.use('/api/migrator', require('./routes/migrator'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/drawpdf', require('./routes/draw-pdf'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/gmaps', require('./routes/gmaps'));
app.use('/api/voximplant', require('./routes/voximplant'));
app.use('/api/google', require('./routes/google'));
app.use('/api/campaign', require('./routes/campaign'));
app.use('/api/witai', require('./routes/witai'));
app.use('/api/product', require('./routes/product'));

// Definir la pagina principal
app.get('/', (req, res) => {
    res.send('Welcome to Laraigo API ');
});
// Arrancar la app
app.listen(PORT, '0.0.0.0', () => {
})

logger.info(`System launch API-LARAIGO on port ${PORT}`);