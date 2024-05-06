const mongoose = require('mongoose');
const { User } = require('../../../models/user');
const { Rental } = require('../../../models/rental');
const { Movie } = require('../../../models/movie');
const request = require('supertest');
const moment = require('moment');


describe('POST /api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let payload;
    let rental;
    let movie;
    let token;

    const exec = async () => {
        return await request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send(payload);
    }

    beforeEach(async () => {
        server = require('../../../index');

        customerId = new mongoose.Types.ObjectId();
        movieId = new mongoose.Types.ObjectId();
        payload = { customerId, movieId };

        movie = new Movie({
            _id: movieId,
            title: '12345',
            genre: { name: '12345' },
            numberInStock: 1,
            dailyRentalRate: 2
        });
        await movie.save();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345'

            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        });
        await rental.save();

        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await Rental.deleteMany({});
        await Movie.deleteMany({});
        await server.close();
    });


    it('should return 401 if the client is not logged in', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided', async () => {
        delete payload.customerId;
        
        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
        delete payload.movieId;

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental is found for this customer/movie', async () => {
        await Rental.deleteMany({});

        const res = await exec();

        expect(res.status).toBe(404);
    });

    it('should return 400 if rental is already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save();

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if request is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });

    it('should set the return date if request is valid', async () => {
        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        const diff = new Date() - rentalInDb.dateReturned;
        expect(diff).toBeLessThan(10 * 1000);
    });

    it('should calculate the rental fee if request is valid', async () => {
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();

        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        expect(rentalInDb.rentalFee).toBe(14);
    });

    it('should increase the movie stock if request is valid', async () => {
        await exec();

        const movieInDb = await Movie.findById(movieId);
        expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental if request is valid', async () => {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);

        expect(Object.keys(res.body))
            .toEqual(expect.arrayContaining([
                'customer', 
                'movie', 'dateOut', 
                'dateReturned', 
                'rentalFee'
            ]));
    });
});