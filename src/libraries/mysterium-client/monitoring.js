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
import Subscriber from '../subscriber'

const HEALTH_CHECK_INTERVAL = 1500
const healthCheckTimeout = 500

type StatusCallback = (boolean) => void
type EmptyCallback = () => void

// TODO: allow unsubscribing from events
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

class StatusMonitoring {
  _statusSubscriber: Subscriber<boolean> = new Subscriber()
  _upSubscriber: Subscriber<void> = new Subscriber()
  _downSubscriber: Subscriber<void> = new Subscriber()
  _changeUpSubscriber: Subscriber<void> = new Subscriber()
  _changeDownSubscriber: Subscriber<void> = new Subscriber()

  _lastStatus: ?boolean = null

  onStatus (callback: StatusCallback): void {
    this._statusSubscriber.subscribe(callback)
    const status = this._lastStatus
    if (status != null) {
      callback(status)
    }
  }

  onStatusUp (callback: EmptyCallback): void {
    this._upSubscriber.subscribe(callback)
    if (this._lastStatus) {
      callback()
    }
  }

  onStatusDown (callback: EmptyCallback): void {
    this._downSubscriber.subscribe(callback)
    if (this._lastStatus === false) {
      callback()
    }
  }

  onStatusChangeUp (callback: EmptyCallback): void {
    this._changeUpSubscriber.subscribe(callback)
  }

  onStatusChangeDown (callback: EmptyCallback): void {
    this._changeDownSubscriber.subscribe(callback)
  }

  updateStatus (status: boolean) {
    this._triggerStatus(status)
    this._lastStatus = status
  }

  _triggerStatus (status: boolean) {
    this._statusSubscriber.notify(status)

    if (status) {
      this._upSubscriber.notify()
    } else {
      this._downSubscriber.notify()
    }

    if (status !== this._lastStatus) {
      this._triggerStatusChange(status)
    }
  }

  _triggerStatusChange (newStatus: boolean) {
    if (newStatus) {
      this._triggerStatusChangeUp()
    } else {
      this._triggerStatusChangeDown()
    }
  }

  _triggerStatusChangeUp () {
    this._changeUpSubscriber.notify()
  }

  _triggerStatusChangeDown () {
    this._changeDownSubscriber.notify()
  }
}

class TequilaMonitoring extends StatusMonitoring implements Monitoring {
  _api: TequilapiClient

  _timer: TimeoutID

  _isStarted: boolean = false

  constructor (tequilapi: TequilapiClient) {
    super()
    this._api = tequilapi
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

  async _healthCheckLoop (): Promise<void> {
    if (!this.isStarted) {
      return
    }

    let isRunning
    try {
      await this._api.healthCheck(healthCheckTimeout)
      isRunning = true
    } catch (e) {
      isRunning = false
    }

    try {
      this.updateStatus(isRunning)
    } catch (e) {
      e.message = 'Bad subscriber added to Monitoring: ' + e.message
      throw e
    } finally {
      if (this._isStarted) {
        this._timer = setTimeout(() => this._healthCheckLoop(), HEALTH_CHECK_INTERVAL)
      }
    }
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
export { StatusMonitoring }
export default TequilaMonitoring
export type { StatusCallback, EmptyCallback, Monitoring }
