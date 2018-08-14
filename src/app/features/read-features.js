const fs = require('fs')

function readFeatures (path) {
  if (!fs.existsSync(path)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(path).toString())
  } catch (e) {
  }

  return null
}

module.exports = readFeatures
