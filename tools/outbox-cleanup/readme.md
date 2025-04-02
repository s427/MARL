# MARL tool - outbox cleanup

A simple script that reads the content of the `outbox.json` in the current directory, and writes its content in a `outbox-public.json` file, after removing posts based on their visibility level.

Requires [Node.js](https://nodejs.org/en).

## Installation

From the tool directory (where `packages.json` is located):

First install the dependencies:

    npm i

Then install the tool globally:

    npm i -g

## Usage

The following commands should be issued from the folder where your `outbox.json` file is located.

Basic command:

    marl cleanup

The script will look for a file named `outbox.json` in the current folder and output a file named `outbox-public.json` in the same folder. If such a file already exists, the user is asked to confirm whether it should be overwritten or not.

By default:
- The script will remove posts that are _private_ (mentioned users only) or for _followers only_; in other words, only the public and unlisted posts are kept.
- Boosts are preserved.

## Options

### Visibility level

You can specifiy which types of posts get removed from the output based on their visibility level:

    marl cleanup -p [CODE]
    marl cleanup --privacy [CODE]

The following codes are available:

- `1`: only keep public posts
- `2`: only keep public and unlisted posts
- `3`: only keep public, unlisted, and followers-only posts
- `4`: keep all posts (useful if you only want to remove your boosts; see below)

The default value is `2`.

### Excluding boosts

You can exclude all boosts from the output:

    marl cleanup -b
    marl cleanup --noboosts

### Help

    marl cleanup --help

