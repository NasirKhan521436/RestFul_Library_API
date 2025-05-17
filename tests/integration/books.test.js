const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../server');
const Book = require('../../models/Book');

beforeAll(async () => {
  await Book.create({
    title: 'Test Book',
    author: 'Test Author',
    isbn: '1234567890'
  });
});

afterAll(async () => {
  await Book.deleteMany();
  await mongoose.connection.close();
});

describe('GET /api/v1/books', () => {
  it('should return 200 and list of books', async () => {
    const res = await request(app).get('/api/v1/books');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.books.length).toBeGreaterThan(0);
  });
});