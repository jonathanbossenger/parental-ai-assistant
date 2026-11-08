import { expect, open, test } from "nsh/test";

test("shows the welcome screen", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("Welcome to your family’s AI companion");
  expect(app.texts()).toContain("A thoughtful space to help your family explore AI together.");
});
