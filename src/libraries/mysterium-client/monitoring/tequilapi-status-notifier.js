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

import type { StatusNotifier } from './status-notifier'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import Publisher from '../../publisher'
import type { StatusCallback } from './monitoring'
import { HEALTH_CHECK_INTERVAL } from './monitoring'

const HEALTHCHECK_TIMEOUT = 500

class TequilapiStatusNotifier implements StatusNotifier {
  _api: TequilapiClient

  _timer: TimeoutID

  _isStarted: boolean = false

  _statusPublisher: Publisher<boolean> = new Publisher()

  constructor (tequilapi: TequilapiClient) {
    this._api = tequilapi
  }

  start () {
    if (this._isStarted) {
      return
    }
    this._isStarted = true
    this._healthCheckLoop()
  }

  stop () {
    this._isStarted = false
    if (this._timer) {
      clearTimeout(this._timer)
    }
  }

  onStatus (callback: StatusCallback): void {
    this._statusPublisher.addSubscriber(callback)
  }

  async _healthCheckLoop (): Promise<void> {
    if (!this._isStarted) {
      return
    }

    let isRunning
    try {
      await this._api.healthCheck(HEALTHCHECK_TIMEOUT)
      isRunning = true
    } catch (e) {
      isRunning = false
    }

    try {
      this._updateStatus(isRunning)
    } catch (e) {
      e.message = 'Bad subscriber added to Monitoring: ' + e.message
      throw e
    } finally {
      if (this._isStarted) {
        this._timer = setTimeout(() => this._healthCheckLoop(), HEALTH_CHECK_INTERVAL)
      }
    }
  }

  _updateStatus (status: boolean) {
    this._statusPublisher.publish(status)
  }
}

export { TequilapiStatusNotifier }
