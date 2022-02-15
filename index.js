require('dotenv').config();
const express = require('express');
const cors = require('cors');

const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://52.116.128.51:5040',
    'https://test-laraigo.s3-web.us-south.cloud-object-storage.appdomain.cloud', //laraigo dev
    'https://scanvirus-cos-static-web-hosting-w26.s3-web.us-south.cloud-object-storage.appdomain.cloud', //laraigo test
    'https://app.laraigo.com', //laraigo prod
    'https://socket.laraigo.com', //broker dev 
    'https://testsocket.laraigo.com', //broker test
    'https://socket.laraigo.com', //broker prod
    'https://zyxmelinux.zyxmeapp.com', //zyxme dev y test (services, hook, bridge, etc)
    'https://backend.laraigo.com', //zyxme prod (services, hook, bridge, etc)
    'https://chatflow.s3-web.us-east.cloud-object-storage.appdomain.cloud', //chatflow pord
    'http://52.116.136.253', //zyxme dev
    'http://52.117.9.143', //zyxme test
];

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        const dateRequest = new Date().toISOString();
        console.log(`${dateRequest}: request from ${origin}`);
        // if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log(`${dateRequest}: not allowed from ${origin}`)
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));
app.use(express.json({ limit: '100mb' }));//to accept json

const PORT = process.env.PORT || 6065;

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
app.use('/api/user', require('./routes/user'));
app.use('/api/check', require('./routes/check'));
app.use('/api/migrator', require('./routes/migrator'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/billing', require('./routes/billing'));

// Definir la pagina principal
app.get('/', (req, res) => {
    res.send('Welcome to Laraigo API ');
});
// Arrancar la app
app.listen(PORT, '0.0.0.0', () => {
})

console.log(`Corriendo en http://localhost:${PORT}`);