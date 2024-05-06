const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const validateObjectID = require('../middleware/validateObjectId');
const { Genre, validateGenre } = require('../models/genre');


router.get('/', async (req, res) => {
    const genres = await Genre.find().sort('name');
    
    res.send(genres);
});

router.post('/', auth, validate(validateGenre), async (req, res) => {
    const genre = new Genre({ name: req.body.name });
    await genre.save();

    res.send(genre);
});

router.put('/:id', auth, validateObjectID, validate(validateGenre), async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(req.params.id, { name: req.body.name }, {
        new: true
    });
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    res.send(genre);
});

router.delete('/:id', auth, admin, validateObjectID, async (req, res) => {
    const genre = await Genre.findByIdAndRemove(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    res.send(genre);
});

router.get('/:id', validateObjectID, async (req, res) => {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    res.send(genre);
});


module.exports = router;