# Unfriends Core

This repo contains multiple packages, to help the developpement on Unfriends

## Install it

- Clone the project
- Setup your .npmrc file from .npmrc.example
Token is generated on [this page](https://github.com/settings/tokens). Check at least 'write:packages' & 'read:packages'

## Dev

- When you develop on a local package, you have to change import on "package.json" from "@unfriends/PACKAGE" to "../unfriend-core/PACKAGE" (you have to put the right path)
It will use the package on your local machine (and be updated on real time, while you're developping)
- Do a PR to main branch
- Once PR has been review, package can be updated