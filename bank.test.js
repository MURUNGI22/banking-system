const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Bank, parseMoney, formatMoney } = require('./bank');

test('opens, authenticates, transfers, and reloads multiple accounts', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'accounts.json');
  const bank = new Bank(file);
  const bob = bank.openAccount('Bob', 'bob-secret');
  const mary = bank.openAccount('Mary', 'mary-secret');

  assert.notEqual(bob.id, mary.id);
  assert.equal(bank.listAccounts().length, 2);
  assert.throws(() => bank.login(bob.id, 'wrong-password'), /Incorrect password/);
  assert.equal(bank.deposit(bob.id, 'bob-secret', 10050), 10050);
  assert.equal(bank.transfer(bob.id, 'bob-secret', mary.id, 2500), 7550);
  assert.equal(bank.withdraw(mary.id, 'mary-secret', 500), 2000);
  assert.throws(() => bank.withdraw(bob.id, 'bob-secret', 10000), /Insufficient funds/);
  assert.throws(() => bank.transfer(bob.id, 'bob-secret', bob.id, 100), /different/);

  const reloaded = new Bank(file);
  assert.equal(reloaded.login(bob.id, 'bob-secret').balanceCents, 7550);
  assert.equal(reloaded.login(mary.id, 'mary-secret').balanceCents, 2000);
  assert.equal(fs.readFileSync(file, 'utf8').includes('bob-secret'), false);
});

test('rejects malformed amounts and invalid account details', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bank = new Bank(path.join(dir, 'accounts.json'));
  assert.throws(() => bank.openAccount(' ', 'password123'), /name/);
  assert.throws(() => bank.openAccount('Bob', 'short'), /Password/);
  const bob = bank.openAccount('Bob', 'password123');
  assert.throws(() => bank.deposit(bob.id, 'password123', -1), /positive/);
  assert.throws(() => bank.deposit(bob.id, 'password123', 0), /positive/);
  assert.throws(() => bank.transfer(bob.id, 'password123', 'missing', 100), /not found/);
  assert.equal(bank.login(bob.id, 'password123').balanceCents, 0);
  assert.equal(parseMoney('10.05'), 1005);
  assert.equal(formatMoney(1005), '10.05');
  for (const value of ['0', '-1', '1.234', 'abc', '1e3']) {
    assert.throws(() => parseMoney(value));
  }
});
