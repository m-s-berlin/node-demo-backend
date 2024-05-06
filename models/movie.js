const Joi = require('joi');
const mongoose = require('mongoose');
const { genreSchema } = require('./genre');


const Movie = mongoose.model('Movie', new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    genre: {
        type: genreSchema,
        required: true
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    }
}));


function validateMovie(movie) {
    const schema = Joi.object({
        title: Joi.string().min(3).max(30).required(),
        genreId: Joi.objectId().required(),
        numberInStock: Joi.number().min(0).required(),
        dailyRentalRate: Joi.number().min(0).required()
    });

    return schema.validate(movie);
}


module.exports.Movie = Movie;
module.exports.validateMovie = validateMovie;