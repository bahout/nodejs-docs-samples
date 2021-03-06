/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require(`../../../test/_setup`);

const express = require('express');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();
const request = require('supertest');

const SAMPLE_PATH = path.join(__dirname, '../app.js');

function getSample () {
  const testApp = express();
  sinon.stub(testApp, 'listen').callsArg(1);
  const expressMock = sinon.stub().returns(testApp);
  const app = proxyquire(SAMPLE_PATH, {
    express: expressMock
  });

  return {
    app: app,
    mocks: {
      express: expressMock
    }
  };
}

test.beforeEach(stubConsole);
test.afterEach(restoreConsole);

test(`sets up the sample`, (t) => {
  const sample = getSample();

  t.true(sample.mocks.express.calledOnce);
  t.true(sample.app.listen.calledOnce);
  t.is(sample.app.listen.firstCall.args[0], process.env.PORT || 8080);
});

test.cb(`should echo a message`, (t) => {
  const sample = getSample();
  request(sample.app)
    .post('/echo')
    .send({ message: 'foo' })
    .expect(200)
    .expect((response) => {
      t.is(response.body.message, 'foo');
    })
    .end(t.end);
});

test.cb(`should try to parse encoded info`, (t) => {
  const sample = getSample();
  request(sample.app)
    .get('/auth/info/googlejwt')
    .expect(200)
    .expect((response) => {
      t.deepEqual(response.body, { id: 'anonymous' });
    })
    .end(t.end);
});

test.cb(`should successfully parse encoded info`, (t) => {
  const sample = getSample();
  request(sample.app)
    .get('/auth/info/googlejwt')
    .set('X-Endpoint-API-UserInfo', new Buffer(JSON.stringify({ id: 'foo' })).toString('base64'))
    .expect(200)
    .expect((response) => {
      t.deepEqual(response.body, { id: 'foo' });
    })
    .end(t.end);
});
