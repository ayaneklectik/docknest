import { dispatchQueuedEmails } from "../lib/email";

dispatchQueuedEmails(25)
  .then((result) => {
    console.log(`Email dispatch complete: ${result.sent} sent, ${result.failed} failed, ${result.queued} queued or sending.`);
    if (result.failed > 0) process.exitCode = 1;
  })
  .catch((error: unknown) => {
    console.error("Email dispatch failed.", error);
    process.exitCode = 1;
  });
