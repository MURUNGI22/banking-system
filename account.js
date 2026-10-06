const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

class Account {
  constructor({ id, holderName, passwordHash, balanceCents = 0 }) {
    if (!id || typeof id !== 'string') throw new Error('Account ID is required.');
    if (!holderName || typeof holderName !== 'string') throw new Error('Account holder name is required.');
    if (!passwordHash || typeof passwordHash !== 'string') throw new Error('Password hash is required.');
    if (!Number.isSafeInteger(balanceCents) || balanceCents < 0) throw new Error('Invalid balance.');
    this.id = id;
    this.holderName = holderName;
    this.passwordHash = passwordHash;
    this.balanceCents = balanceCents;
  }

  static create(id, holderName, password) {
    const name = holderName.trim();
    if (!name) throw new Error('Account holder name is required.');
    if (typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return new Account({ id, holderName: name, passwordHash: `${salt}:${hash}` });
  }

  authenticate(password) {
    const [salt, hash] = this.passwordHash.split(':');
    if (!salt || !hash || typeof password !== 'string') return false;
    const stored = Buffer.from(hash, 'hex');
    const supplied = scryptSync(password, salt, stored.length);
    return stored.length === supplied.length && timingSafeEqual(stored, supplied);
  }

  deposit(cents) {
    Account.validateAmount(cents);
    const next = this.balanceCents + cents;
    if (!Number.isSafeInteger(next)) throw new Error('Balance exceeds the supported limit.');
    this.balanceCents = next;
  }

  withdraw(cents) {
    Account.validateAmount(cents);
    if (cents > this.balanceCents) throw new Error('Insufficient funds.');
    this.balanceCents -= cents;
  }

  static validateAmount(cents) {
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      throw new Error('Amount must be a positive number of cents.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      holderName: this.holderName,
      passwordHash: this.passwordHash,
      balanceCents: this.balanceCents,
    };
  }
}

module.exports = { Account };
