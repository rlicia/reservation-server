const mongoose = require('mongoose');

const ClientDetail = mongoose.model('ClientDetail');
const UserDetail = mongoose.model('UserDetail');

module.exports = async (req, res, next) => {
    if (req.user.status === 1) {
        const checkActivation = await ClientDetail.findOne({ client: req.user._id });
        if (checkActivation.status === 0) {
            return res.status(422).send({ error: 'Your Account is deactivated. Please contact Administrator.' });
        }
    }
    if (req.user.status === 0) {
        const checkActivation = await UserDetail.findOne({ user: req.user._id });
        if (checkActivation.status === 0) {
            return res.status(422).send({ error: 'Your Account is deactivated. Please contact Administrator.' });
        }
    }

    next();
};