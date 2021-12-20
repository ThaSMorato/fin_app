import faker from "faker";
import "dotenv/config";

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let usersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

const user = {
  email: faker.internet.email(),
  name: faker.name.firstName(),
  password: "123456",
  id: "",
};

const OLD_ENV = process.env;

describe("#CreateUserUseCase", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "super_secret";
  });

  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);

    const user_response = await createUserUseCase.execute({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    user.id = user_response.id ?? user.id;
  });

  afterAll(() => {
    process.env = { ...OLD_ENV };
  });

  it("should not be able to authenticate an user with the wrong email", async () => {
    try {
      await authenticateUserUseCase.execute({
        email: `not${user.email}`,
        password: user.password,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("Incorrect email or password");
      expect(e.statusCode).toBe(401);
    }
  });

  it("should not be able to authenticate an user with the wrong password", async () => {
    try {
      await authenticateUserUseCase.execute({
        email: user.email,
        password: `not${user.password}`,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("Incorrect email or password");
      expect(e.statusCode).toBe(401);
    }
  });

  it("should be able to authenticate an user if email and password is correct", async () => {
    console.log(process.env.JWT_SECRET);

    const authenticated_user = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(authenticated_user).toEqual(
      expect.objectContaining({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: expect.any(String),
      })
    );
  });
});
