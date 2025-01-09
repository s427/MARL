# MARL as a `webxdc` app

This folder contains the necessary files to build a [`webxdc`](https://webxdc.org) version of `MARL`.

## Build

To build the `webxdc` app type `make` in the folder. This will create a `marl.xdc` file, which is a zip file. It should be attached to a tagged release in order to be picked up by the webxdc app store.

## Files

* `Makefile` for building `marl.xdc`
* `manifest.toml` manifest file with basic metadata about the app
* `icon.png` app icon, bitmap version
* `icon.svg` app icon, vectorized version
