require('dotenv').config();
const logger = require('./config/winston');
const morganMiddleware = require("./config/morgan.middleware");

const express = require('express');
const cors = require('cors');

const allowedOrigins = process.env.ADDRESSES_ALLOWED?.split(",") || [];

const app = express();

app.use(morganMiddleware);

app.use(cors({
    origin: function (origin, callback) {
        const dateRequest = new Date().toISOString();
        // console.log(`${dateRequest}: request from ${origin}`);
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // console.log(`${dateRequest}: not allowed from ${origin}`)
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json({ limit: '100mb' }));//to accept json

const PORT = process.env.PORT || 6065;

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
app.use('/api/billing', require('./routes/billing'));
app.use('/api/gmaps', require('./routes/gmaps'));
app.use('/api/voximplant', require('./routes/voximplant'));

// Definir la pagina principal
app.get('/', (req, res) => {
    res.send('Welcome to Laraigo API ');
});
// Arrancar la app
app.listen(PORT, '0.0.0.0', () => {
})

logger.info(`System launch http://localhost:${PORT}`);