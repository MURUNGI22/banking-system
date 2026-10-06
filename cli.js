const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { Bank, parseMoney, formatMoney } = require('./bank');

async function main() {
  const bank = new Bank(process.env.BANK_DATA_FILE);
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = (prompt) => rl.question(prompt);

  try {
    while (true) {
      console.log('\n1. Open account  2. List accounts  3. Balance  4. Deposit');
      console.log('5. Withdraw      6. Transfer       7. Exit');
      const choice = (await ask('Choose an option: ')).trim();
      try {
        if (choice === '7') break;
        if (choice === '1') {
          const name = await ask('Account holder name: ');
          const password = await ask('Password (at least 8 characters): ');
          const account = bank.openAccount(name, password);
          console.log(`Opened account for ${account.holderName}. ID: ${account.id}`);
        } else if (choice === '2') {
          const accounts = bank.listAccounts();
          if (accounts.length === 0) console.log('No accounts yet.');
          for (const account of accounts) console.log(`${account.id}  ${account.holderName}`);
        } else if (['3', '4', '5', '6'].includes(choice)) {
          const id = (await ask('Your account ID: ')).trim();
          const password = await ask('Password: ');
          if (choice === '3') {
            console.log(`Balance: ${formatMoney(bank.login(id, password).balanceCents)}`);
          } else if (choice === '4' || choice === '5') {
            const cents = parseMoney((await ask('Amount: ')).trim());
            const balance = choice === '4'
              ? bank.deposit(id, password, cents)
              : bank.withdraw(id, password, cents);
            console.log(`New balance: ${formatMoney(balance)}`);
          } else {
            const toId = (await ask('Destination account ID: ')).trim();
            const cents = parseMoney((await ask('Amount: ')).trim());
            console.log(`New balance: ${formatMoney(bank.transfer(id, password, toId, cents))}`);
          }
        } else {
          console.log('Choose a number from 1 to 7.');
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main };
