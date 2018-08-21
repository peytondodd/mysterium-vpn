'use strict'

const path = require('path')
const readFeatures = require('../src/app/features/read-features')

const PRODUCTION_FILE = 'features.prod.json'
const LOCAL_FILE = 'features.json'

const getFeatureFilePath = (fileName) => path.join(__dirname, '../', fileName)

let productionFeatures = {}
let localFeatures = {}

try {
  productionFeatures = readFeatures(getFeatureFilePath(PRODUCTION_FILE))
} catch (e) {
  throw new Error(`Failed to read ${PRODUCTION_FILE}. This file is required for building.`)
}

try {
  localFeatures = readFeatures(getFeatureFilePath(LOCAL_FILE))
} catch (e) {

}

const features = Object.assign(productionFeatures, localFeatures)

module.exports = features
