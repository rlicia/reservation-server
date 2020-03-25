module.exports = (req, res , next) => {
    if (req.user.status !== 0) {
        return res.status(403).send({ error: 'You do not have permission to access' });
    }

    next();
};