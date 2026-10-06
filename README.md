# Banking system

Run `node banking-system/cli.js` from the repository root, or `node cli.js` from this folder. Use the numbered menu to open accounts, list accounts, check a balance, deposit, withdraw, and transfer. Bob and Mary can each open an account and transfer between them using their account IDs. Amounts are entered with up to two decimal places.

Accounts are saved in `accounts.json` beside the program. Passwords are stored as salted scrypt hashes. Keep this file private: this is a learning project, not a production banking service. To use a different data file, set the `BANK_DATA_FILE` environment variable before starting the program.

Run tests with `node --test banking-system/bank.test.js` from the repository root.
