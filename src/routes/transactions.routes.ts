import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import { mapSeries } from 'async';

import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import Transaction from '../models/Transaction';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute({
    transaction_id: id,
  });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { filename } = request.file;

    const importTransactions = new ImportTransactionsService();
    const createTransactions = new CreateTransactionService();

    const csvTransactions = await importTransactions.execute({
      filename,
    });

    const transactions: Transaction[] = await mapSeries(
      csvTransactions,
      async (transaction, callback) => {
        const newTransaction = await createTransactions.execute({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: transaction.category_id,
        });

        return callback(null, newTransaction);
      },
    );

    return response.json(transactions);
  },
);

export default transactionsRouter;
