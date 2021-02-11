#!/usr/bin/env node

const path = require('path')
const chalk = require('chalk')
const fse = require('fs-extra')
const spawn = require('cross-spawn')
const createConfig = require('./config')

const resolvePath = rel => path.resolve(__dirname, '../..', rel)

function run() {
  try {
    const paths = {
      build: resolvePath('build'),
      copy: resolvePath('node_modules/.bin/cpy'),
      README: resolvePath('README.md'),
      faucet: resolvePath('node_modules/.bin/faucet'),
      pkgPath: resolvePath('build/package.json'),
      types: resolvePath('types.d.ts'),
      babel: resolvePath('node_modules/.bin/babel'),
      eslint: resolvePath('node_modules/.bin/eslint'),
      rollup: resolvePath('node_modules/.bin/rollup'),
      tape: resolvePath('node_modules/.bin/tape')
    }
    const { pkg, commands } = createConfig(paths)

    fse.emptyDirSync(paths.build)
    fse.writeJsonSync(paths.pkgPath, pkg, { spaces: 2 })
    fse.copySync(paths.README, `${paths.build}/README.md`)

    let exitStatus = 0

    // eslint-disable-next-line no-restricted-syntax
    for (const cmd of commands) {
      const { command, args, context } = cmd
      const { status, error } = spawn.sync(command, args, context)
      exitStatus = status
      if (error) {
        throw new Error(error)
      }
    }

    process.exit(exitStatus)
  } catch (error) {
    console.error(chalk.red(error))
    process.exit(1)
  }
}

run()
