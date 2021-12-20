import faker from "faker";
import "dotenv/config";

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let usersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;

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
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepository);

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

  it("should not be able to show an user with the user does not exists", async () => {
    try {
      await showUserProfileUseCase.execute(`not${user.id}`);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe("User not found");
      expect(e.statusCode).toBe(404);
    }
  });

  it("should be able to show an user profile if user exists", async () => {
    const user_profile = await showUserProfileUseCase.execute(user.id);

    expect(user_profile).toEqual(
      expect.objectContaining({
        ...user,
        password: expect.any(String),
      })
    );
  });
});
