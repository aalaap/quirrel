import delay from "delay";
import { runQuirrel } from "./runQuirrel";
import { expectTableCellToEqual, expectTableToBeEmpty } from "./invoke.spec";

let cleanup: (() => Promise<void>)[] = [];

beforeEach(() => {
  cleanup = [];
});

afterEach(async () => {
  await Promise.all(cleanup.map((clean) => clean()));
});

it("shows activity feed", async () => {
  const quirrel = await runQuirrel();
  cleanup.push(quirrel.cleanup);

  await page.goto("http://localhost:3000/activity");

  await delay(500);

  await expectTableToBeEmpty(page);

  const job = await quirrel.client.enqueue("job", { delay: "1min", id: "job" });
  await delay(50);
  await expectTableCellToEqual(1, 4, "scheduled", page);

  await job.delete();
  await delay(50);
  await expectTableCellToEqual(2, 4, "deleted", page);

  const job2 = await quirrel.client.enqueue("job-1", {
    delay: "1min",
    id: "job-2",
    repeat: {
      times: 2,
      every: "1sec",
    },
  });
  await delay(50);
  await expectTableCellToEqual(3, 4, "scheduled", page);

  await job2.invoke();
  await delay(50);
  await expectTableCellToEqual(4, 4, "invoked", page);
  await expectTableCellToEqual(5, 4, "started", page);
  await expectTableCellToEqual(6, 4, "completed", page);
  await expectTableCellToEqual(7, 4, "rescheduled", page);
});
