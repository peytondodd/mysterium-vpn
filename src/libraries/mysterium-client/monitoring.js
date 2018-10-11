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
import { promisify } from 'util'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import sleep from '../sleep'

const HEALTH_CHECK_INTERVAL = 1500
const healthCheckTimeout = 500

type StatusCallback = (boolean) => void
type EmptyCallback = () => void

interface Monitoring {
  start (): void,

  stop (): void,

  onStatus (callback: StatusCallback): void,

  onStatusUp (callback: EmptyCallback): void,

  onStatusDown (callback: EmptyCallback): void,

  onStatusChangeUp (callback: EmptyCallback): void,

  onStatusChangeDown (callback: EmptyCallback): void,

  isStarted (): boolean
}

class TequilaMonitoring implements Monitoring {
  api: TequilapiClient
  _timer: TimeoutID

  _lastIsRunning: ?boolean = null
  _subscribersStatus: Array<StatusCallback> = []
  _subscribersUp: Array<EmptyCallback> = []
  _subscribersDown: Array<EmptyCallback> = []
  _subscribersChangeUp: Array<EmptyCallback> = []
  _subscribersChangeDown: Array<EmptyCallback> = []
  _isStarted: boolean = false

  constructor (tequilapi: TequilapiClient) {
    this.api = tequilapi
  }

  isStarted (): boolean {
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
    const status = this._lastIsRunning
    if (status != null) {
      callback(status)
    }
  }

  removeOnStatus (callback: StatusCallback) {
    const i = this._subscribersStatus.indexOf(callback)
    if (i >= 0) {
      this._subscribersStatus.splice(i, 1)
    }
  }

  onStatusUp (callback: EmptyCallback) {
    this._subscribersUp.push(callback)
    if (this._lastIsRunning) {
      callback()
    }
  }

  onStatusDown (callback: EmptyCallback) {
    this._subscribersDown.push(callback)
    if (this._lastIsRunning === false) {
      callback()
    }
  }

  onStatusChangeUp (callback: EmptyCallback) {
    this._subscribersChangeUp.push(callback)
  }

  onStatusChangeDown (callback: EmptyCallback) {
    this._subscribersChangeDown.push(callback)
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
    if (isRunning) {
      this._notifySubscribersUp()
    } else {
      this._notifySubscribersDown()
    }

    if (this._lastIsRunning === isRunning) {
      return
    }
    if (isRunning) {
      this._notifySubscribersChangeUp()
    } else {
      this._notifySubscribersChangeDown()
    }
    this._lastIsRunning = isRunning
  }

  _notifySubscribersStatus (isRunning: boolean) {
    this._subscribersStatus.forEach((callback: StatusCallback) => {
      callback(isRunning)
    })
  }

  _notifySubscribersUp () {
    this._subscribersUp.forEach((callback: EmptyCallback) => {
      callback()
    })
  }

  _notifySubscribersDown () {
    this._subscribersDown.forEach((callback: EmptyCallback) => {
      callback()
    })
  }

  _notifySubscribersChangeUp () {
    this._subscribersChangeUp.forEach((callback: EmptyCallback) => {
      callback()
    })
  }

  _notifySubscribersChangeDown () {
    this._subscribersChangeDown.forEach((callback: EmptyCallback) => {
      callback()
    })
  }
}

function waitForStatusUp (tequilapi: TequilapiClient, timeout: number): Promise<void> {
  const monitoring = new TequilaMonitoring(tequilapi)
  const statusUpAsync = promisify(monitoring.onStatusChangeUp.bind(monitoring))
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
export default TequilaMonitoring
export type { StatusCallback, EmptyCallback, Monitoring }
