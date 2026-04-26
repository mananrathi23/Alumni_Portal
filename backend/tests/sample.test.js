import request from 'supertest';
import express from 'express';

// Create a dummy express app for testing Supertest setup
const testApp = express();
testApp.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Testing endpoint works' });
});

describe('Sample Test Suite', () => {
  it('should pass a basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should pass a basic API test using supertest', async () => {
    const response = await request(testApp).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Testing endpoint works');
  });
});
