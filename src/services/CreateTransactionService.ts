import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const categoriessRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoryExists = await categoriessRepository.findOne({
      where: {
        title: category,
      },
    });

    let categoryId;

    if (categoryExists) {
      categoryId = categoryExists.id;
    } else {
      const categoryObject = categoriessRepository.create({
        title: category,
      });

      const newCategory = await categoriessRepository.save(categoryObject);

      categoryId = newCategory.id;
    }

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      const newBalance = total - value;

      if (newBalance < 0) {
        throw new AppError(
          'This transaction is higher than the total in balance.',
        );
      }
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryId,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
