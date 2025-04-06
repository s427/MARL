import { readFileSync, writeFileSync, existsSync } from "fs";
import readline from "readline";
import chalk from "chalk";

const verbose = false;

function cleanup(options) {
  let json = "";
  let level = 2;
  let levelDesc = "";
  let noBoosts = false;

  if (options) {
    if (options.privacy) {
      switch (+options.privacy) {
        case 1:
        case 2:
        case 3:
        case 4:
          level = +options.privacy;
          break;
        default:
          console.log(
            chalk.red(`Invalid option provided (${options.privacy}); falling back to default value (${level}).`)
          );
          break;
      }
    }
    if (options.noboosts) {
      noBoosts = true;
    }
  }

  switch (level) {
    case 1:
      levelDesc = "only keep public posts";
      break;
    case 2:
      levelDesc = "only keep public and unlisted posts";
      break;
    case 3:
      levelDesc = "only keep public, unlisted, and followers-only posts";
      break;
    case 4:
      levelDesc = "keep all posts";
      break;
  }

  console.log(chalk.cyan("MARL cleanup"));
  console.log(chalk.cyan(`  - privacy level: ${level} (${levelDesc})`));
  if (noBoosts) {
    console.log(chalk.cyan(`  - exclude boosts`));
  }

  const opt = {
    level: level,
    noBoosts: noBoosts,
  };

  try {
    const data = readFileSync("./outbox.json");
    json = JSON.parse(data);
    console.log(chalk.cyan("'outbox.json' successfully read."));
  } catch (error) {
    console.log(chalk.red("Error loading 'outbox.json'. Aborting."));
    if (verbose) {
      console.error(error);
    }
    return;
  }

  if (existsSync("./outbox-public.json")) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(chalk.yellow("Notice: 'outbox-public.json' already exists!"));
    rl.question(`Overwrite? (Y|n) `, (answer) => {
      rl.close();

      if (answer === "" || answer.toLocaleLowerCase() === "y") {
        console.log(chalk.yellow("Overwriting..."));
        writeFile(json, opt);
      } else {
        console.log(chalk.yellow("Aborting."));
        return;
      }
    });
  } else {
    writeFile(json, opt);
  }
}

function filterPosts(json, opt) {
  const level = opt.level;
  const noBoosts = opt.noBoosts;

  const filteredItems = json.orderedItems.filter((item) => {
    if (noBoosts && item.type === "Announce") {
      // this is a boost
      return false;
    }

    // conditions borrowed from MARL (utils.js > tootVisibility())
    if (item.to.includes("https://www.w3.org/ns/activitystreams#Public")) {
      // post is public
      return true;
    }
    if (
      item.to.some((x) => x.indexOf("/followers") > -1) &&
      !item.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
      item.cc.includes("https://www.w3.org/ns/activitystreams#Public")
    ) {
      // post is unlisted
      return level >= 2;
    }
    if (
      item.to.some((x) => x.indexOf("/followers") > -1) &&
      !item.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
      !item.cc.includes("https://www.w3.org/ns/activitystreams#Public")
    ) {
      // post is followers only
      return level >= 3;
    }
    if (
      !item.to.some((x) => x.indexOf("/followers") > -1) &&
      !item.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
      !item.cc.includes("https://www.w3.org/ns/activitystreams#Public")
    ) {
      // post is private (mentioned people only)
      return level >= 4;
    }
  });
  json.orderedItems = filteredItems;

  return json;
}

function writeFile(json, opt) {
  if (json && json.orderedItems) {
    const path = "./outbox-public.json";

    json = filterPosts(json, opt);

    try {
      writeFileSync(path, JSON.stringify(json), "utf8");
      console.log(chalk.cyan("'outbox-public.json' successfully written to disk."));
    } catch (error) {
      console.log(chalk.red("Error writing 'outbox-public.json' to disk."));
      if (verbose) {
        console.error(error);
      }
    }
  } else {
    console.log(chalk.red("Invalid JSON structure. Aborting"));
  }
}

export default cleanup;
