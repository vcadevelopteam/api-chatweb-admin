const express = require('express');
const cors = require('cors');

const allowedOrigins = ['http://localhost:3000', 'http://52.116.128.51:5040'];

const app = express();

app.use(cors(
//     {
//     origin: function (origin, callback) {
//         console.log(origin);
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.indexOf(origin) === -1) {
//             var msg = 'The CORS policy for this site does not ' +
//                 'allow access from the specified Origin.';
//             return callback(new Error(msg), false);
//         }
//         return callback(null, true);
//     }
// }
));
app.use(express.json());//to accept json

const PORT = process.env.PORT || 6065;

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/channel', require('./routes/channel'));
app.use('/api/ticket', require('./routes/ticket'));
app.use('/api/main', require('./routes/main'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/load', require('./routes/load'));

// Definir la pagina principal
app.get('/', (req, res) => {
    res.send('Hola desde el chatweb');
});
// Arrancar la app
app.listen(PORT, '0.0.0.0', () => {
})

console.log(`ChatWeb esta corriendo en el puerto http://localhost:${PORT}`);