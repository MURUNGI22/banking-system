const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Account } = require('./account');

class Bank {
  constructor(filePath = path.join(__dirname, 'accounts.json')) {
    this.filePath = filePath;
    this.accounts = new Map();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(data)) throw new Error('Account file must contain an array.');
      for (const item of data) {
        const account = new Account(item);
        if (this.accounts.has(account.id)) throw new Error('Duplicate account ID in account file.');
        this.accounts.set(account.id, account);
      }
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify([...this.accounts.values()], null, 2), { mode: 0o600 });
    fs.renameSync(tempPath, this.filePath);
  }

  openAccount(holderName, password) {
    const account = Account.create(randomUUID(), holderName, password);
    this.accounts.set(account.id, account);
    this.save();
    return account;
  }

  listAccounts() {
    return [...this.accounts.values()].map(({ id, holderName }) => ({ id, holderName }));
  }

  getAccount(id) {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found.');
    return account;
  }

  login(id, password) {
    const account = this.getAccount(id);
    if (!account.authenticate(password)) throw new Error('Incorrect password.');
    return account;
  }

  deposit(id, password, cents) {
    const account = this.login(id, password);
    account.deposit(cents);
    this.save();
    return account.balanceCents;
  }

  withdraw(id, password, cents) {
    const account = this.login(id, password);
    account.withdraw(cents);
    this.save();
    return account.balanceCents;
  }

  transfer(fromId, password, toId, cents) {
    if (fromId === toId) throw new Error('Choose a different destination account.');
    const from = this.login(fromId, password);
    const to = this.getAccount(toId);
    Account.validateAmount(cents);
    if (cents > from.balanceCents) throw new Error('Insufficient funds.');
    if (!Number.isSafeInteger(to.balanceCents + cents)) {
      throw new Error('Destination balance exceeds the supported limit.');
    }
    from.withdraw(cents);
    to.deposit(cents);
    this.save();
    return from.balanceCents;
  }
}

function parseMoney(input) {
  if (typeof input !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)) {
    throw new Error('Enter a positive amount with at most two decimal places.');
  }
  const [whole, fraction = ''] = input.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  Account.validateAmount(cents);
  return cents;
}

function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

module.exports = { Bank, parseMoney, formatMoney };
