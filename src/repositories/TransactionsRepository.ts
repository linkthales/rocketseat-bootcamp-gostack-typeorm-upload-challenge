import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find();

    const balance = transactions.reduce<Balance>(
      (currentBalance, transaction) =>
        transaction.type === 'income'
          ? {
              ...currentBalance,
              income: currentBalance.income + transaction.value,
              total: currentBalance.total + transaction.value,
            }
          : {
              ...currentBalance,
              outcome: currentBalance.outcome + transaction.value,
              total: currentBalance.total - transaction.value,
            },
      { income: 0, outcome: 0, total: 0 },
    );

    return balance;
  }
}

export default TransactionsRepository;
