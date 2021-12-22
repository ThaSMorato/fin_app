import faker from "faker";

import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AppError } from "../../../../shared/errors/AppError";

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

let usersRepository: InMemoryUsersRepository;
let statementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
const user = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: faker.internet.password(),
  id: "",
};

describe("#CreateStatementUseCase", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );

    const user_response = await usersRepository.create({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    user.id = user_response.id ?? user.id;

    await statementsRepository.create({
      amount: 900,
      description: "Initial transaction",
      type: OperationType.DEPOSIT,
      user_id: user.id,
    });
  });

  it("should not be able to create a statement if user is not found", async () => {
    try {
      await createStatementUseCase.execute({
        user_id: `not${user.id}`,
        amount: 1000,
        description: faker.lorem.sentence(),
        type: OperationType.DEPOSIT,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("User not found");
      expect(e.statusCode).toBe(404);
    }
  });

  it("should not be able to withdraw if amount is more than the found of the user", async () => {
    try {
      await createStatementUseCase.execute({
        user_id: user.id,
        amount: 1000,
        description: faker.lorem.sentence(),
        type: OperationType.WITHDRAW,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("Insufficient funds");
      expect(e.statusCode).toBe(400);
    }
  });

  it("should be able to withdraw if amount is less than the found of the user and user exists", async () => {
    const statement_object = {
      user_id: user.id,
      amount: 800,
      description: faker.lorem.sentence(),
      type: OperationType.WITHDRAW,
    };

    const statement = await createStatementUseCase.execute(statement_object);

    expect(statement).toEqual(
      expect.objectContaining({
        ...statement_object,
        id: expect.any(String),
      })
    );
  });

  it("should be able to deposit if user exists", async () => {
    const statement_object = {
      user_id: user.id,
      amount: 1800,
      description: faker.lorem.sentence(),
      type: OperationType.DEPOSIT,
    };

    const statement = await createStatementUseCase.execute(statement_object);

    expect(statement).toEqual(
      expect.objectContaining({
        ...statement_object,
        id: expect.any(String),
      })
    );
  });
});
