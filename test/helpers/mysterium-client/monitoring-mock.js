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

import type { StatusCallback }
  from '../../../src/libraries/mysterium-client/monitoring/monitoring'
import Publisher from '../../../src/libraries/publisher'
import type { StatusNotifier } from '../../../src/libraries/mysterium-client/monitoring/status-notifier'

class MockStatusNotifier implements StatusNotifier {
  _started: boolean = false
  _lastStatus: ?boolean = null
  _statusPublisher: Publisher<boolean> = new Publisher()

  start (): void {
    this._started = true
  }

  stop (): void {
  }

  onStatus (callback: StatusCallback): void {
    this._statusPublisher.subscribe(callback)
    const status = this._lastStatus
    if (status != null) {
      // TODO: remove this initial invokation in this class?
      callback(status)
    }
  }

  notifyStatus (status: boolean) {
    this._statusPublisher.notify(status)
  }
}

export { MockStatusNotifier }
