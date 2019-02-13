#!/usr/bin/env node

const chalk = require('chalk')
const fse = require('fs-extra')
const spawn = require('cross-spawn')
const resolvePaths = require('./paths')
const createConfig = require('./config')

function run() {
  try {
    const paths = resolvePaths()
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
