const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

function startTestServer() {
  return app.listen(0);
}

async function getBaseUrl(server) {
  const port = await new Promise((resolve) => server.once('listening', () => resolve(server.address().port)));
  return `http://127.0.0.1:${port}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  return { response, body: await response.json() };
}

async function registerAndLogin(baseUrl) {
  const email = `user-${Date.now()}-${Math.random()}@example.com`;
  const password = 'password123';
  const registerResult = await requestJson(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(registerResult.response.status, 201);
  assert.equal(registerResult.body.user.email, email);
  assert.equal('password' in registerResult.body.user, false);

  const loginResult = await requestJson(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(loginResult.response.status, 200);
  assert.equal(typeof loginResult.body.token, 'string');
  return loginResult.body.token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

test('registers users and rejects invalid credentials', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const invalidResult = await requestJson(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' })
    });
    assert.equal(invalidResult.response.status, 400);

    const token = await registerAndLogin(baseUrl);
    const invalidLogin = await requestJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'password123' })
    });
    assert.equal(invalidLogin.response.status, 401);
    assert.equal(typeof token, 'string');
  } finally {
    server.close();
  }
});

test('requires a JWT for every task route', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const result = await requestJson(`${baseUrl}/tasks`);
    assert.equal(result.response.status, 401);
    assert.equal(result.body.success, false);
  } finally {
    server.close();
  }
});

test('performs the complete authenticated task CRUD flow', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const token = await registerAndLogin(baseUrl);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const createResult = await requestJson(`${baseUrl}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'CRUD task', description: 'Test every operation' })
    });
    assert.equal(createResult.response.status, 201);
    const taskId = createResult.body.task.id;

    const listResult = await requestJson(`${baseUrl}/tasks`, { headers: authHeaders(token) });
    assert.equal(listResult.response.status, 200);
    assert.equal(listResult.body.tasks.some((task) => task.id === taskId), true);

    const getResult = await requestJson(`${baseUrl}/tasks/${taskId}`, { headers: authHeaders(token) });
    assert.equal(getResult.response.status, 200);

    const updateResult = await requestJson(`${baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title: 'Updated CRUD task', description: 'Updated task details' })
    });
    assert.equal(updateResult.response.status, 200);
    assert.equal(updateResult.body.task.title, 'Updated CRUD task');

    const deleteResult = await requestJson(`${baseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    });
    assert.equal(deleteResult.response.status, 200);

    const missingResult = await requestJson(`${baseUrl}/tasks/${taskId}`, { headers: authHeaders(token) });
    assert.equal(missingResult.response.status, 404);
  } finally {
    server.close();
  }
});

test('rejects malformed task payloads before the controller', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const token = await registerAndLogin(baseUrl);
    const result = await requestJson(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Missing title' })
    });
    assert.equal(result.response.status, 400);
    assert.equal(result.body.error, 'Title is required');
  } finally {
    server.close();
  }
});

test('rejects task requests without application/json content type', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const token = await registerAndLogin(baseUrl);
    const result = await requestJson(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: authHeaders(token),
      body: 'not json'
    });
    assert.equal(result.response.status, 415);
  } finally {
    server.close();
  }
});

test('returns structured errors for invalid IDs and unknown routes', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const token = await registerAndLogin(baseUrl);
    const invalidIdResult = await requestJson(`${baseUrl}/tasks/abc`, {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Bad id', description: 'Bad id details' })
    });
    assert.equal(invalidIdResult.response.status, 400);

    const unknownResult = await requestJson(`${baseUrl}/does-not-exist`);
    assert.equal(unknownResult.response.status, 404);
    assert.equal(unknownResult.body.error, 'Route not found');
  } finally {
    server.close();
  }
});

test('returns a structured 405 for unsupported methods on a task detail route', async () => {
  const server = startTestServer();
  const baseUrl = await getBaseUrl(server);

  try {
    const token = await registerAndLogin(baseUrl);
    const result = await requestJson(`${baseUrl}/tasks/123`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', description: 'Test details' })
    });
    assert.equal(result.response.status, 405);
    assert.equal(result.body.error, 'Method not allowed');
  } finally {
    server.close();
  }
});
