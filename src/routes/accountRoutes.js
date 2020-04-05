const express = require('express');
const mongoose = require('mongoose');

const requireAuth = require('../middlewares/requireAuth');

const User = mongoose.model('User');
const ClientDetail = mongoose.model('ClientDetail');
const UserDetail = mongoose.model('UserDetail');
const UserTier = mongoose.model('UserTier');

const router = express.Router();

router.use(requireAuth);

//Get Account
router.get('/account',async (req, res) => {
    const { _id, username, status } = req.user;
    try {
        let detail;
        let permissions;
        if (status === 1) {
            detail = await ClientDetail.findOne({ client: _id }).populate('tier');
            permissions = null;
        }
        if (status === 0) {
            detail = await UserDetail.findOne({ user: _id }).populate('tier');
            tier = await UserTier.findById(detail.tier._id);
            permissions = tier.permissions;
        }

        const account = {
            username,
            status,
            firstName: detail.detail.firstName.charAt(0).toUpperCase() + detail.detail.firstName.substring(1),
            lastName: detail.detail.lastName.charAt(0).toUpperCase() + detail.detail.lastName.substring(1),
            email: detail.detail.email,
            gender: detail.detail.gender === 1 ? 'Male' : 'Female',
            tier: detail.tier.tierName.charAt(0).toUpperCase() + detail.tier.tierName.substring(1),
            accountStatus: detail.status,
            permissions: permissions
        };
        res.status(200).send({ account });
    } catch (err) {
        return res.status(500).send({ error: err });
    }
});

//Edit Account Detail
router.put('/account', async (req, res) => {
    const { firstName, lastName, email } = req.body;
    const { _id, status } = req.user;
    try {
        let detail;
        if (status === 1) {
            detail = await ClientDetail.findOne({ client: _id });
            const checkEmail = await ClientDetail.findOne({ "detail.email": email });
            if (checkEmail && detail.detail.email !== email.toLowerCase()) {
                return res.status(422).send({ error: 'This email is already taken' });
            }
        }
        if (status === 0) {
            detail = await UserDetail.findOne({ user: _id });
            const checkEmail = await UserDetail.findOne({ "detail.email": email });
            if (checkEmail && detail.detail.email !== email.toLowerCase()) {
                return res.status(422).send({ error: 'This email is already taken' });
            }
        }

        detail.detail = { ...detail.detail, firstName, lastName, email };
        await detail.save();
        res.status(200).send('Detail Updated');
    } catch (err) {
        return res.status(500).send({ error: err });
    }
});

//Change Password
router.put('/account/password', async (req, res) => {
    const { password, newPassword } = req.body;
    const { _id } = req.user;
    try {
        const user = await User.findById(_id);
        await user.comparePassword(password);
        user.password = newPassword;
        user.save();
        res.status(200).send('Password Updated');
    } catch (err) {
        return res.status(500).send({ error: err });
    }
});

module.exports = router;