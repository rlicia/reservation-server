const express = require('express');
const mongoose = require('mongoose');

const requireAuth = require('../middlewares/requireAuth');
const requireActivation = require('../middlewares/requireActivation');
const requireUser = require('../middlewares/requireUser');

const User = mongoose.model('User');
const ClientDetail = mongoose.model('ClientDetail');
const UserDetail = mongoose.model('UserDetail');
const ClientTier = mongoose.model('ClientTier');
const UserTier = mongoose.model('UserTier');

const router = express.Router();

router.use(requireAuth);
router.use(requireActivation);
router.use(requireUser);

//Create User
router.post('/user/createuser', async (req, res) => {
    const { username, password, firstName, lastName, email, gender, tierId } = req.body;
    try {
        const checkUser = await User.findOne({ username });
        const checkEmail = await UserDetail.findOne({ "detail.email": email });
        if (checkUser) {
            return res.status(422).send({ error: 'This username is already taken' });
        }
        if (checkEmail) {
            return res.status(422).send({ error: 'This email is already taken' });
        }

        const tier = await UserTier.findById(tierId);
        if (!tier) {
            return res.status(404).send({ error: 'Invalid Tier' });
        }

        const user = new User({ username, password, status: 0 });
        const detail = new UserDetail({
            user: user._id,
            tier: tierId,
            detail: { firstName, lastName, email, gender }
        });
        await user.save();
        await detail.save();
        res.status(200).send({ username, firstName, lastName, email, gender, tier: tier.tierName });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Get Client & User
router.get('/user/account/search/:status/:username', async (req, res) => {
    const { username, status } = req.params;
    try {
        const user = await User.find({ $and: [ { username: { $regex: `^${username}` } }, { status } ] }, { password: 0 });
        if (!user) {
            return res.status(404).send({ error: 'Invalid User' });
        }
        
        res.status(200).send({ user });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Get Client & User Detail
router.get('/user/account/detail/:status/:id', async (req, res) => {
    const { id, status } = req.params;
    try {
        let detailData;
        if (status === '1') {
            detailData = await ClientDetail.findOne({ client: id }).populate('tier');
        }
        if (status === '0') {
            detailData = await UserDetail.findOne({ user: id }).populate('tier');
        }
        
        const detail = {
            _id: detailData._id,
            firstName: detailData.detail.firstName.charAt(0).toUpperCase() + detailData.detail.firstName.substring(1),
            lastName: detailData.detail.lastName.charAt(0).toUpperCase() + detailData.detail.lastName.substring(1),
            email: detailData.detail.email,
            gender: detailData.detail.gender === 1 ? 'Male' : 'Female',
            tierId: detailData.tier._id,
            tier: detailData.tier.tierName.charAt(0).toUpperCase() + detailData.tier.tierName.substring(1),
            rfidTag: detailData.rfidTag,
            accountStatus: detailData.status
        };
        return res.status(200).send({ detail });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Update Tier
router.put('/user/account/detail/tier/:status/:id', async (req, res) => {
    const { id, status } = req.params;
    const { newTierId } = req.body;
    try {
        let detail;
        if (status === '1') {
            detail = await ClientDetail.findById(id);
            if (!detail) {
                return res.status(404).send({ error: 'Invalid User Detail' });
            }

            const tier = await ClientTier.findById(newTierId);
            if (!tier) {
                return res.status(422).send({ error: 'Invalid Tier' });
            }

            detail.tier = newTierId;
        }
        if (status === '0') {
            detail = await UserDetail.findById(id);
            if (!detail) {
                return res.status(404).send({ error: 'Invalid User Detail' });
            }

            const tier = await UserTier.findById(newTierId);
            if (!tier) {
                return res.status(422).send({ error: 'Invalid Tier' });
            }

            detail.tier = newTierId;
        }

        await detail.save();
        res.status(200).send('Tier Updated');
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Update RFID Tag
router.put('/user/account/detail/rfid/:id', async (req, res) => {
    const { id } = req.params;
    const { newRfidTag } = req.body;
    try {
        const detail = await ClientDetail.findById(id);
        if (!detail) {
            return res.status(404).send({ error: 'Invalid User Detail' });
        }

        const checkRfidTag = await ClientDetail.findOne({ rfidTag: newRfidTag });
        if (checkRfidTag) {
            return res.status(422).send({ error: 'This RFID tag is already taken' });
        }

        detail.rfidTag = newRfidTag;
        await detail.save();
        res.status(200).send('RFID Tag Updated');
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Update Status (Activate or Deactivate)
router.put('/user/account/detail/:status/:id/status', async (req, res) => {
    const { status, id } = req.params;
    try {
        let detailData;
        if (status === '1') {
            detailData = await ClientDetail.findById(id).populate('tier');
        }
        if (status === '0') {
            detailData = await UserDetail.findById(id).populate('tier');
        }

        if (detailData.status === 1) {
            detailData.status = 0;
        }
        else if (detailData.status === 0) {
            detailData.status = 1;
        }

        await detailData.save();
        const detail = {
            _id: detailData._id,
            firstName: detailData.detail.firstName.charAt(0).toUpperCase() + detailData.detail.firstName.substring(1),
            lastName: detailData.detail.lastName.charAt(0).toUpperCase() + detailData.detail.lastName.substring(1),
            email: detailData.detail.email,
            gender: detailData.detail.gender === 1 ? 'Male' : 'Female',
            tier: detailData.tier.tierName.charAt(0).toUpperCase() + detailData.tier.tierName.substring(1),
            rfidTag: detailData.rfidTag,
            accountStatus: detailData.status
        };
        res.status(200).send({ detail });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

module.exports = router;