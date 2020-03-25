require('./models/User');
require('./models/ClientDetail');
require('./models/UserDetail');
require('./models/Tier');
require('./models/Slot');
require('./models/Transaction');
require('./models/History');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

const mechanicRoutes = require('./routes/mechanicRoutes');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const tierRoutes = require('./routes/tierRoutes');
const userRoutes = require('./routes/userRoutes');
const parkingRoutes = require('./routes/parkingRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(mechanicRoutes);
app.use(authRoutes);
app.use(accountRoutes);
app.use(transactionRoutes);
app.use(tierRoutes);
app.use(userRoutes);
app.use(parkingRoutes);

const mongoUri = 'mongodb+srv://application:zesjXl5AxnKhdw3l@reservation-yccvf.gcp.mongodb.net/reservation?retryWrites=true&w=majority'

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log('Connected to mongo instance');
});

mongoose.connection.on('error', (err) => {
    console.log('Error Connecting to mongo', err);
});

app.get('/', (req, res) => {
    res.status(200).send('This is Reservation System.');
});

app.listen(port, () => {
    console.log(`Listening on PORT ${port}`);
});