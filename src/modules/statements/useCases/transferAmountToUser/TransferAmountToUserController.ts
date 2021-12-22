import { Request, Response } from "express";
import { container } from "tsyringe";
import { TransferAmountToUserUseCase } from "./TransferAmountToUserUseCase";

export class TransferAmountToUserController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { id: owner_id } = request.user;

    const { user_id } = request.params;

    const { amount, description } = request.body;

    const transferAmountToUserUseCase = container.resolve(
      TransferAmountToUserUseCase
    );

    const transactions = await transferAmountToUserUseCase.execute({
      owner_id,
      user_id,
      amount,
      description,
    });

    return response.status(201).json(transactions);
  }
}
