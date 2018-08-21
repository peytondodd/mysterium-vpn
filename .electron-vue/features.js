'use strict'

const path = require('path')
const readFeatures = require('../src/app/features/read-features')

const PRODUCTION_FILE = 'features.prod.json'
const LOCAL_FILE = 'features.json'

const getFeatureFilePath = (fileName) => path.join(__dirname, '../', fileName)

let localFeatures = {}

const productionFeatures = readFeatures(getFeatureFilePath(PRODUCTION_FILE))

try {
  localFeatures = readFeatures(getFeatureFilePath(LOCAL_FILE))
} catch (e) {

}

const features = Object.assign(productionFeatures, localFeatures)

module.exports = features
