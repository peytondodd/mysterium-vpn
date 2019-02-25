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
import type { Metric, RavenData } from './metrics'
import type { SyncRendererCommunication } from '../../communication/sync/sync-communication'
import { TimeFormatter } from '../../../libraries/formatters/time-formatter'

/**
 * Collects metrics, proxying all requests to communication.
 */
class BugReporterMetricsProxy implements BugReporterMetrics {
  _syncCommunication: SyncRendererCommunication
  _timeFormatter: TimeFormatter

  constructor (syncCommunication: SyncRendererCommunication, timeFormatter: TimeFormatter) {
    this._syncCommunication = syncCommunication
    this._timeFormatter = timeFormatter
  }

  set (metric: Metric, value: mixed) {
    this._syncCommunication.sendMetric({ metric, value })
  }

  setWithCurrentDateTime (metric: Metric) {
    this.set(metric, this._timeFormatter.getCurrentTimeISOFormat())
  }

  getMetrics (): RavenData {
    return this._syncCommunication.getMetrics()
  }
}

export { BugReporterMetricsProxy }
