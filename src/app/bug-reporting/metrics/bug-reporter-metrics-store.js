/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterium-vpn" Authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @flow

import type { BugReporterMetrics } from './bug-reporter-metrics'
import { MapSync } from '../../../libraries/map-sync'
import { getCurrentTimeISOFormat } from '../../../libraries/strings'
import { EXTRA, NOT_SET, TAGS } from './metrics'
import type { KeyValueMap, Metric, RavenData } from './metrics'

/**
 * Collects metrics storing them.
 */
class BugReporterMetricsStore implements BugReporterMetrics {
  // TODO: get rid of MapSync?
  _mapSync: MapSync<Metric>

  constructor () {
    this._mapSync = new MapSync()
  }

  set (metric: Metric, value: mixed) {
    this._mapSync.set(metric, value)
  }

  get (metric: Metric): mixed {
    return this._mapSync.get(metric)
  }

  setWithCurrentDateTime (metric: Metric) {
    this._mapSync.set(metric, getCurrentTimeISOFormat())
  }

  getMetrics (): RavenData {
    const data = { tags: {}, extra: {} }
    data.tags = this._getValues((Object.values(TAGS): any))
    data.extra = this._getValues((Object.values(EXTRA): any))
    return data
  }

  _getValues (metrics: Array<Metric>): KeyValueMap {
    const result = {}
    for (let metric of metrics) {
      result[metric] = this._mapSync.get(metric) || NOT_SET
    }
    return result
  }
}

export default BugReporterMetricsStore
