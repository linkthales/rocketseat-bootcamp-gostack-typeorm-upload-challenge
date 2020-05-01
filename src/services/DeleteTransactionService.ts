import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  transaction_id: string;
}

class DeleteTransactionService {
  public async execute({ transaction_id }: Request): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const transaction = await transactionsRepository.findOne(transaction_id);

    if (!transaction) {
      throw new AppError('Incorrect transaction id.');
    }

    await transactionsRepository.delete(transaction.id);
  }
}

export default DeleteTransactionService;
