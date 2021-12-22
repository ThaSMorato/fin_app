import faker from "faker";
import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

let usersRepository: InMemoryUsersRepository;
let statementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

const user = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: faker.internet.password(),
  id: "",
};

describe("#GetBalanceUseCase", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    getBalanceUseCase = new GetBalanceUseCase(
      statementsRepository,
      usersRepository
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

  it("should not be able to return the balance if user is not found", async () => {
    try {
      await getBalanceUseCase.execute({
        user_id: `not${user.id}`,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("User not found");
      expect(e.statusCode).toBe(404);
    }
  });

  it("should be able to return the balance if user is found", async () => {
    const balance = await getBalanceUseCase.execute({
      user_id: user.id,
    });

    expect(balance).toEqual(
      expect.objectContaining({
        statement: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            user_id: user.id,
            amount: 900,
            description: "Initial transaction",
            type: OperationType.DEPOSIT,
          }),
        ]),
        balance: 900,
      })
    );
  });
});
