const mockAdd = jest.fn();
jest.mock("bullmq", () => ({
  Queue: jest.fn(() => ({ add: mockAdd, close: jest.fn() })),
}));

jest.mock("../../../config/email", () => ({
  getEmailConfig: () => ({
    redis: { url: "redis://localhost:6379" },
    queue: { maxAttempts: 3, retryDelay: 1000 },
  }),
}));

import { queueSignupVerificationEmail } from "../emailQueue";

describe("emailQueue", () => {
  it("confirmação do cadastro: enfileira o tipo signup-verification com nome, email e token", async () => {
    await queueSignupVerificationEmail("user-1", "Maria Silva", "maria@test.com", "tok-123");

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "send-signup-verification",
      {
        type: "signup-verification",
        userId: "user-1",
        userName: "Maria Silva",
        userEmail: "maria@test.com",
        verificationToken: "tok-123",
      },
      { priority: 1 }
    );
  });
});
