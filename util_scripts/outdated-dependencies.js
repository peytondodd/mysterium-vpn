const parseVersion = (version) => {
  const [_, major, minor, patch] = version.match(/(\d+)\.(\d+).(\d+)/)

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10)
  }
}

const needsToBeUpdated = (current, latest) => {
  const currentVersion = parseVersion(current)
  const latestVersion = parseVersion(latest)

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

const printPackageInfo = ({ name, current, latest }) => {
  console.log('\x1b[31m%s\x1b[0m - current: %s, latest: %s', name, current, latest)
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
  packages.data.body.forEach((pkg) => {
    if (needsToBeUpdated(pkg[1], pkg[3])) {
      printPackageInfo({
        name: pkg[0],
        current: pkg[1],
        latest: pkg[3]
      })
    }
  })
})
