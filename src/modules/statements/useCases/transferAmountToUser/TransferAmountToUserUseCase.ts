import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { TransferAmountToUserError } from "./TransferAmountToUserError";

interface IRequest {
  owner_id: string;
  user_id: string;
  amount: number;
  description: string;
}

interface IResponse {
  received_transaction: Statement;
  transfered_transaction: Statement;
}

enum OperationType {
  TRANSFER = "transfer",
}

@injectable()
export class TransferAmountToUserUseCase {
  constructor(
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository,

    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}

  async execute({
    owner_id,
    user_id,
    amount,
    description,
  }: IRequest): Promise<IResponse> {
    const receiver = await this.usersRepository.findById(user_id);

    if (!receiver) {
      throw new TransferAmountToUserError.UserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({
      user_id: owner_id,
    });

    if (balance < amount) {
      throw new TransferAmountToUserError.InsufficientFunds();
    }

    const received_transaction = await this.statementsRepository.create({
      amount,
      description,
      type: OperationType.TRANSFER,
      user_id,
      sender_id: owner_id,
    });

    const transfered_transaction = await this.statementsRepository.create({
      amount: -amount,
      description,
      type: OperationType.TRANSFER,
      user_id: owner_id,
      receiver_id: user_id,
    });

    return { received_transaction, transfered_transaction };
  }
}
