/*
 * Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
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
import { EXTRA, NOT_SET, TAGS } from './metrics'
import type { KeyValueMap, Metric, RavenData } from './metrics'
import { TimeFormatter } from '../../../libraries/time-formatter'

/**
 * Collects metrics storing them.
 */
class BugReporterMetricsStore implements BugReporterMetrics {
  _timeFormatter: TimeFormatter

  constructor (timeFormatter: TimeFormatter) {
    this._timeFormatter = timeFormatter
  }

  _metrics: Map<Metric, mixed> = new Map()

  set (metric: Metric, value: mixed) {
    this._metrics.set(metric, value)
  }

  get (metric: Metric): mixed {
    return this._metrics.get(metric) || NOT_SET
  }

  setWithCurrentDateTime (metric: Metric) {
    this.set(metric, this._timeFormatter.getCurrentTimeISOFormat())
  }

  getMetrics (): RavenData {
    const tagList: Metric[] = ((Object.values(TAGS): any))
    const tags = this._getValues(tagList)
    const extraList: Metric[] = (Object.values(EXTRA): any)
    const extra = this._getValues(extraList)
    return { tags, extra }
  }

  _getValues (metrics: Metric[]): KeyValueMap {
    const result = {}
    for (let metric of metrics) {
      result[metric] = this._metrics.get(metric) || NOT_SET
    }
    return result
  }
}

export default BugReporterMetricsStore
