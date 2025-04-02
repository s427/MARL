#! /usr/bin/env node

import { program } from "commander";
import cleanup from "./commands/cleanup.js";

program
  .command("cleanup")
  .description(
    `Reads 'outbox.json' and writes its content to 'outbox-public.json' after removing posts based on their visibility level.`
  )
  .option(
    "-p, --privacy <level>",
    `
    The privacy level of the output, ie which type of post to include. Default is 2.
    Possible values:
          1: only keep public posts
          2: only keep public and unlisted posts
          3: only keep public, unlisted, and followers-only posts
          4: keep all posts
`
  )
  .option("-b, --noboosts", "Remove all boosts from archive.")
  .action(cleanup);

program.parse();
