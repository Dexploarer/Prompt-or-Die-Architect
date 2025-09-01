import { mock } from "bun:test";

mock.module("openai", () => ({
  default: class OpenAI {
    constructor() {
      // do nothing
    }
    chat = {
      completions: {
        create: mock(),
      },
    };
  },
}));
