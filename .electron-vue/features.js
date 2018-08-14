'use strict'

const path = require('path')
const readFeatures = require('../src/app/features/read-features')

const PRODUCTION_FILE = 'features.prod.json'
const LOCAL_FILE = 'features.json'

const getFeatureFilePath = (fileName) => path.join(__dirname, '../', fileName)

const productionFeatures = readFeatures(getFeatureFilePath(PRODUCTION_FILE))
const localFeatures = readFeatures(getFeatureFilePath(LOCAL_FILE))

if (!productionFeatures) {
  throw new Error(`Failed to read ${PRODUCTION_FILE}. This file is required for building.`)
}

const features = Object.assign(productionFeatures, localFeatures)

module.exports = features
