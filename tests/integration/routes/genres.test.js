const mongoose = require('mongoose');
const { Genre } = require('../../../models/genre');
const { User } = require('../../../models/user');
const request = require('supertest');


describe('/api/genres', () => {
    let server;

    beforeEach(() => { server = require('../../../index'); });

    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });

    
    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' }
            ]);

            const res = await request(server).get('/api/genres');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return the matching genre if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre1' });
            await genre.save();

            const res = await request(server).get('/api/genres/' + genre._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/genres/1');

            expect(res.status).toBe(404);
        });

        it('should return 404 if no genre with the given id exists', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/genres/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        let token;
        let name;

        const exec = async () => {
            return await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({ name });
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if genre is less than 3 characters', async () => {
            name = '1'

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre is more than 30 characters', async () => {
            name = new Array(32).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the genre if it is valid', async () => {
            await exec();

            const genre = Genre.find({ name: 'genre1' });

            expect(genre).not.toBeNull();
        });

        it('should return the genre if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');
        });
    });

    describe('PUT /:id', () => {
        let genre;
        let id;
        let token;
        let newName;

        const exec = async () => {
            return await request(server)
                .put('/api/genres/' + id)
                .set('x-auth-token', token)
                .send({ name: newName });
        }

        beforeEach(async () => {
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            id = genre._id;

            token = new User().generateAuthToken();

            newName = 'genre2'
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if genre is less than 3 characters', async () => {
            newName = '1'

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre is more than 30 characters', async () => {
            newName = new Array(32).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if id is not found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the genre if it is valid', async () => {
            await exec();

            const genreInDb = await Genre.findById(id);

            expect(genreInDb.name).toBe(newName);
        });

        it('should return the updated genre if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });
    });

    describe('DELETE /:id', () => {
        let genre;
        let id;
        let token;

        const exec = async () => {
            return await request(server)
                .delete('/api/genres/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            id = genre._id;

            token = new User({ isAdmin: true }).generateAuthToken();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if client is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if id is not found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the genre if it is valid', async () => {
            await exec();

            const result = await Genre.findById(id);

            expect(result).toBeNull();
        });

        it('should return the deleted genre', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', genre._id.toHexString());
            expect(res.body).toHaveProperty('name', genre.name);
        });
    });
});