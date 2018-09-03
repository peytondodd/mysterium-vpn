/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterion" Authors.
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
import { promisify } from 'util'
import type { TequilapiClient } from '../mysterium-tequilapi/client'
import sleep from '../sleep'

const HEALTH_CHECK_INTERVAL = 1500
const healthCheckTimeout = 500

type StatusCallback = (boolean) => void
type UpCallback = () => void
type DownCallback = () => void

class Monitoring {
  api: TequilapiClient
  _timer: TimeoutID

  _lastIsRunning: boolean = false
  _subscribersStatus: Array<StatusCallback> = []
  _subscribersUp: Array<UpCallback> = []
  _subscribersDown: Array<DownCallback> = []
  _isStarted: boolean = false

  constructor (tequilapi: TequilapiClient) {
    this.api = tequilapi
  }

  get isStarted (): boolean {
    return this._isStarted
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

  onStatus (callback: StatusCallback) {
    this._subscribersStatus.push(callback)
    if (this._isStarted) {
      callback(this._lastIsRunning)
    }
  }

  removeOnStatus (callback: StatusCallback) {
    const i = this._subscribersStatus.indexOf(callback)
    if (i >= 0) {
      this._subscribersStatus.splice(i, 1)
    }
  }

  onStatusUp (callback: UpCallback) {
    this._subscribersUp.push(callback)
  }

  onStatusDown (callback: DownCallback) {
    this._subscribersDown.push(callback)
  }

  async _healthCheckLoop (): Promise<void> {
    if (!this.isStarted) {
      return
    }

    let isRunning
    try {
      await this.api.healthCheck(healthCheckTimeout)
      isRunning = true
    } catch (e) {
      isRunning = false
    }

    try {
      this._notifySubscribers(isRunning)
    } catch (e) {
      e.message = 'Bad subscriber added to Monitoring: ' + e.message
      throw e
    } finally {
      if (this._isStarted) {
        this._timer = setTimeout(() => this._healthCheckLoop(), HEALTH_CHECK_INTERVAL)
      }
    }
  }

  _notifySubscribers (isRunning: boolean) {
    this._notifySubscribersStatus(isRunning)

    if (this._lastIsRunning === isRunning) {
      return
    }
    if (isRunning) {
      this._notifySubscribersUp()
    } else {
      this._notifySubscribersDown()
    }
    this._lastIsRunning = isRunning
  }

  _notifySubscribersStatus (isRunning: boolean) {
    this._subscribersStatus.forEach((callback: StatusCallback) => {
      callback(isRunning)
    })
  }

  _notifySubscribersUp () {
    this._subscribersUp.forEach((callback: UpCallback) => {
      callback()
    })
  }

  _notifySubscribersDown () {
    this._subscribersDown.forEach((callback: DownCallback) => {
      callback()
    })
  }
}

function waitForStatusUp (tequilapi: TequilapiClient, timeout: number): Promise<void> {
  const monitoring = new Monitoring(tequilapi)
  const statusUpAsync = promisify(monitoring.onStatusUp.bind(monitoring))
  monitoring.start()

  return Promise.race([
    throwErrorAfterTimeout(timeout),
    statusUpAsync()
  ]).finally(() => {
    monitoring.stop()
  })
}

async function throwErrorAfterTimeout (timeout: number) {
  await sleep(timeout)
  throw new Error(`Timeout of ${timeout}ms passed`)
}

export { waitForStatusUp, HEALTH_CHECK_INTERVAL }
export default Monitoring
export type { StatusCallback, UpCallback, DownCallback }
