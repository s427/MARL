import { readFileSync, writeFileSync, existsSync } from "fs";
import readline from "readline";
import chalk from "chalk";

const verbose = false;

function cleanup(option) {
  let json = "";
  let level = 2;

  if (option && option.privacy) {
    switch (+option.privacy) {
      case 1:
      case 2:
      case 3:
        level = +option.privacy;
        break;
      default:
        console.log(
          chalk.red(`Invalid option provided (${option.privacy}); falling back to default value (${level}).`)
        );
        break;
    }
  }
  console.log(chalk.cyan(`MARL cleanup - privacy level: ${level}`));

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
        writeFile(json, level);
      } else {
        console.log(chalk.yellow("Aborting."));
        return;
      }
    });
  } else {
    writeFile(json, level);
  }
}

function filterPosts(json, level) {
  const filteredItems = json.orderedItems.filter((item) => {
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
      return level === 2 || level === 3;
    }
    if (
      item.to.some((x) => x.indexOf("/followers") > -1) &&
      !item.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
      !item.cc.includes("https://www.w3.org/ns/activitystreams#Public")
    ) {
      // post is followers only
      return level === 3;
    }
    if (
      !item.to.some((x) => x.indexOf("/followers") > -1) &&
      !item.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
      !item.cc.includes("https://www.w3.org/ns/activitystreams#Public")
    ) {
      // post is private (mentioned people only)
      return false;
    }
  });
  json.orderedItems = filteredItems;

  return json;
}

function writeFile(json, level) {
  if (json && json.orderedItems) {
    const path = "./outbox-public.json";

    json = filterPosts(json, level);

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
