const utilHelpers = require('../src/libraries/util-helpers')

/**
 * Removes version suffix, i.e. for '1.0.0-beta.24' only '1.0.0' is returned.
 */
const removeVersionSuffix = (version) => {
  const indexOf = version.indexOf('-')
  if (indexOf == -1) {
    return version
  }
  return version.substring(0, indexOf)
}

const needsToBeUpdated = (current, latest) => {
  const currentVersion = utilHelpers.parseVersion(removeVersionSuffix(current))
  const latestVersion = utilHelpers.parseVersion(removeVersionSuffix(latest))

  if (latestVersion.major > currentVersion.major) {
    return true
  }

  if (latestVersion.major === currentVersion.major) {
    if (latestVersion.minor > currentVersion.minor) {
      return true
    }
  }

  return false
}

const formatPackageLineText = ({ name, current, latest }) => {
  return `\x1b[31m${name}\x1b[0m - current: ${current}, latest: ${latest}`
}

const getOutdatedPackages = (packages) => {
  return packages.data.body
    .filter((pkg) => needsToBeUpdated(pkg[1], pkg[3]))
    .map((pkg) => formatPackageLineText({
      name: pkg[0],
      current: pkg[1],
      latest: pkg[3]
    }))
}

// JSON from `yarn outdated --json` command is piped into this script
const stdin = process.openStdin()

let data = ''

stdin.on('data', (chunk) => {
  data += chunk
}).on('end', () => {
  // yarn outdated returns two JSON lines
  // we can ignore the first one
  [_, json] = data.split('\n')

  console.log('Outdated packages:')

  const packages = JSON.parse(json)
  const outdated = getOutdatedPackages(packages).join('\n')

  console.log(outdated)
})
