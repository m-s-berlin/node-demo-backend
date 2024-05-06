const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const Joi = require('joi');
const { User } = require('../models/user');
const bcrypt = require('bcrypt');


router.post('/', validate(validateCredentials), async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();

    res.send(token);
});


function validateCredentials(body) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });

    return schema.validate(body);
}


module.exports = router;