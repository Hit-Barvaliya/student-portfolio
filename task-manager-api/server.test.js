const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

function startTestServer() {
  return app.listen(0);
}

test('creates a task with valid JSON payload', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));

  try {
    const response = await fetch(`http://127.0.0.1:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write report', description: 'Draft summary' })
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.task.title, 'Write report');
  } finally {
    server.close();
  }
});

test('rejects POST requests without application/json content type', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));

  try {
    const response = await fetch(`http://127.0.0.1:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json'
    });

    assert.equal(response.status, 415);
    const body = await response.json();
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test('rejects invalid task IDs before update/delete handlers', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));

  try {
    const response = await fetch(`http://127.0.0.1:${port}/tasks/abc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Bad id' })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.error, /valid task ID/i);
  } finally {
    server.close();
  }
});

test('returns a structured JSON 404 for unknown routes', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));

  try {
    const response = await fetch(`http://127.0.0.1:${port}/does-not-exist`);

    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Route not found');
  } finally {
    server.close();
  }
});

test('returns a structured JSON 405 for unsupported methods on a task detail route', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));

  try {
    const response = await fetch(`http://127.0.0.1:${port}/tasks/123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' })
    });

    assert.equal(response.status, 405);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Method not allowed');
  } finally {
    server.close();
  }
});
