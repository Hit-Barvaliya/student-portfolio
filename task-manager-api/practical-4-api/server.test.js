const test = require('node:test');
const assert = require('node:assert/strict');
const { app, tasks } = require('./server');

function startTestServer() {
  return app.listen(0);
}

test('performs create, read, update, and delete operations', async () => {
  tasks.length = 0;
  const server = startTestServer();
  const port = await new Promise((resolve) => {
    server.once('listening', () => resolve(server.address().port));
  });
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Practical 4', description: 'Test CRUD' })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    const taskId = created.task.id;

    const getResponse = await fetch(`${baseUrl}/tasks/${taskId}`);
    assert.equal(getResponse.status, 200);

    const updateResponse = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.task.completed, true);

    const listResponse = await fetch(`${baseUrl}/tasks`);
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.tasks.length, 1);

    const deleteResponse = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    assert.equal(deleteResponse.status, 200);

    const missingResponse = await fetch(`${baseUrl}/tasks/${taskId}`);
    assert.equal(missingResponse.status, 404);
  } finally {
    server.close();
  }
});

test('returns structured 404 for an undefined route', async () => {
  const server = startTestServer();
  const port = await new Promise((resolve) => {
    server.once('listening', () => resolve(server.address().port));
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/unknown`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      success: false,
      error: 'Route not found'
    });
  } finally {
    server.close();
  }
});
