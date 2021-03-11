const express = require('express');
const cors = require('cors');
// const bodyParser = require('body-parser');
const app = express();
app.use(cors());

// app.use(bodyParser.json({ limit: '100mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

app.use(express.json());//to accept json

const PORT = process.env.PORT || 5050;

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/main', require('./routes/main'));
app.use('/api/template', require('./routes/template'));
app.use('/api/processfile', require('./routes/processfile'));

// Definir la pagina principal
app.get('/', (req, res) => {
    res.send('Hola Mundo');
});
// Arrancar la app
app.listen(PORT, '0.0.0.0', () => {
    console.log(`El servidor esta corriendo en el puerto ${PORT}`);
})