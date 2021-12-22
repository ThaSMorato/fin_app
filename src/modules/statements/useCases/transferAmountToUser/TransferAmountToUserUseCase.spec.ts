import faker from "faker";
import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { TransferAmountToUserUseCase } from "./TransferAmountToUserUseCase";

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

let usersRepository: InMemoryUsersRepository;
let statementsRepository: InMemoryStatementsRepository;
let transferAmountToUserUseCase: TransferAmountToUserUseCase;

const user = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: faker.internet.password(),
  id: "",
};

const owner = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: faker.internet.password(),
  id: "",
};

const first_statement = {
  amount: 900,
  description: "Initial transaction",
  type: OperationType.DEPOSIT,
  user_id: "",
  id: "",
};

describe("#TransferAmountToUserUseCase", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    transferAmountToUserUseCase = new TransferAmountToUserUseCase(
      statementsRepository,
      usersRepository
    );

    const user_response = await usersRepository.create({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    user.id = user_response.id ?? user.id;

    const owner_response = await usersRepository.create({
      email: owner.email,
      name: owner.name,
      password: owner.password,
    });

    owner.id = owner_response.id ?? owner.id;

    first_statement.user_id = owner.id;

    const created_statement = await statementsRepository.create({
      amount: first_statement.amount,
      description: first_statement.description,
      type: first_statement.type,
      user_id: first_statement.user_id,
    });

    first_statement.id = created_statement.id ?? first_statement.id;
  });

  it("should not be able to finish a transferation if user is not found", async () => {
    try {
      await transferAmountToUserUseCase.execute({
        user_id: `not${user.id}`,
        amount: 1000,
        description: `transferencia test`,
        owner_id: owner.id,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("User not found");
      expect(e.statusCode).toBe(404);
    }
  });

  it("should not be able to transfer if amount is more than the found of the owner", async () => {
    try {
      await transferAmountToUserUseCase.execute({
        user_id: user.id,
        amount: first_statement.amount * 10,
        description: `transferencia test`,
        owner_id: owner.id,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("Insufficient funds");
      expect(e.statusCode).toBe(400);
    }
  });

  it("should be able to transfer if amount is less than the found of the owner and user exists", async () => {
    const transfer_object = {
      user_id: user.id,
      amount: first_statement.amount - 100,
      description: `transferencia test`,
      owner_id: owner.id,
    };

    const statements = await transferAmountToUserUseCase.execute(
      transfer_object
    );

    expect(statements).toEqual(
      expect.objectContaining({
        received_transaction: {
          amount: transfer_object.amount,
          description: transfer_object.description,
          sender_id: transfer_object.owner_id,
          type: "transfer",
          user_id: transfer_object.user_id,
          id: expect.any(String),
        },
        transfered_transaction: {
          description: transfer_object.description,
          receiver_id: transfer_object.user_id,
          type: "transfer",
          user_id: transfer_object.owner_id,
          amount: -transfer_object.amount,
          id: expect.any(String),
        },
      })
    );
  });
});
