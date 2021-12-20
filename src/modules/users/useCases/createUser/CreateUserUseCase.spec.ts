import faker from "faker";

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";

let usersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

const user = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: faker.internet.password(),
  id: "",
};

describe("#CreateUserUseCase", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);

    const user_response = await usersRepository.create({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    user.id = user_response.id ?? user.id;
  });

  it("should not be able to create an user with the same email", async () => {
    try {
      await createUserUseCase.execute({
        email: user.email,
        name: user.name,
        password: user.password,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("User already exists");
      expect(e.statusCode).toBe(400);
    }
  });

  it("should be able to return the statement if user and statement is found", async () => {
    const new_user = {
      email: faker.internet.email(),
      name: faker.name.firstName(),
      password: faker.internet.password(),
    };

    const statement = await createUserUseCase.execute(new_user);

    expect(statement).toEqual(
      expect.objectContaining({
        ...new_user,
        id: expect.any(String),
        password: expect.any(String),
      })
    );
  });
});
