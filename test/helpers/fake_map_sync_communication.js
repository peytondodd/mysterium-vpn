/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import type { MetricCommunication, MetricValueDto } from '../../src/app/bug-reporting/metrics/metric-communication'

/**
 * Allows tracking method invocations.
 */
class FakeMapSyncCommunication implements MetricCommunication {
  _mapUpdateCallbacks: Set<MetricValueDto => void> = new Set()

  sendMapUpdate (data: MetricValueDto): void {
    for (let callback of this._mapUpdateCallbacks) {
      callback(data)
    }
  }

  onMapUpdate (callback: (MetricValueDto => void)): void {
    this._mapUpdateCallbacks.add(callback)
  }
}

export default FakeMapSyncCommunication
