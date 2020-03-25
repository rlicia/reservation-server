const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = mongoose.model('User');
const ClientDetail = mongoose.model('ClientDetail');

const router = express.Router();

//Sign Up
router.post('/signup', async (req, res) => {
    const { username, password, firstName, lastName, email, gender } = req.body;
    try {
        const checkUser = await User.findOne({ username });
        const checkEmail = await ClientDetail.findOne({ "detail.email": email });
        if (checkUser) {
            return res.status(422).send({ error: 'This username is already taken' });
        }
        if (checkEmail) {
            return res.status(422).send({ error: 'This email is already taken' });
        }

        const user = new User({ username, password });
        const detail = new ClientDetail({
            client: user._id,
            tier: '5e390b2637ed9b1c28d53174', //not assigned tier id
            rfidTag: user._id,
            detail: { firstName, lastName, email, gender }
        });
        await user.save();
        await detail.save();
        const token = jwt.sign({ userId: user._id }, 'PARKING_RESERVATION_APP_SECRET_KEY');
        res.status(200).send({ token });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Sign In
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: 'Invalid username or password' });
        }

        await user.comparePassword(password);
        const token = jwt.sign({ userId: user._id }, 'PARKING_RESERVATION_APP_SECRET_KEY');
        res.status(200).send({ token });
    } catch (err) {
        return res.status(422).send({ error: err });
    }
});

module.exports = router;