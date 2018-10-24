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
import { onFirstEventOrTimeout } from '../../app/events'

const HEALTH_CHECK_INTERVAL = 1500
const MYSTERIUM_CLIENT_WAITING_THRESHOLD = 10000
const healthCheckTimeout = 500

type StatusCallback = (boolean) => void
type EmptyCallback = () => void

// TODO: allow unsubscribing from events
interface Monitoring {
  start (): void,
  stop (): void,

  onStatus (callback: StatusCallback): void,

  /**
   * Triggers once service is up. Triggers instantly if it is already up.
   */
  onStatusUp (callback: EmptyCallback): void,
  waitForStatusUpWithTimeout (): Promise<void>,

  /**
   * Triggers once service is up. Does not trigger instantly if it is already up.
   */
  onNewStatusUp (callback: EmptyCallback): void,
  waitForNewStatusUpWithTimeout (): Promise<void>,

  /**
   * Triggers once service status changes to up.
   */
  onStatusChangeUp (callback: EmptyCallback): void,

  /**
   * Triggers once service is down. Triggers instantly if it is already down.
   */
  onStatusDown (callback: EmptyCallback): void,
  waitForStatusDownWithTimeout (): Promise<void>,

  /**
   * Triggers once service is down. Does not trigger instantly if it is already down.
   */
  onNewStatusDown (callback: EmptyCallback): void,
  waitForNewStatusDownWithTimeout (): Promise<void>,

  /**
   * Triggers once service status changes to down.
   */
  onStatusChangeDown (callback: EmptyCallback): void
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
    this.onNewStatusUp(callback)
    if (this._lastStatus) {
      callback()
    }
  }

  onNewStatusUp (callback: EmptyCallback): void {
    this._upSubscriber.subscribe(callback)
  }

  onStatusChangeUp (callback: EmptyCallback): void {
    this._changeUpSubscriber.subscribe(callback)
  }

  waitForNewStatusUpWithTimeout (): Promise<void> {
    return onFirstEventOrTimeout(this.onNewStatusUp.bind(this), MYSTERIUM_CLIENT_WAITING_THRESHOLD)
  }

  waitForStatusUpWithTimeout (): Promise<void> {
    return onFirstEventOrTimeout(this.onStatusUp.bind(this), MYSTERIUM_CLIENT_WAITING_THRESHOLD)
  }

  onStatusDown (callback: EmptyCallback): void {
    this.onNewStatusDown(callback)
    if (this._lastStatus === false) {
      callback()
    }
  }

  onNewStatusDown (callback: EmptyCallback): void {
    this._downSubscriber.subscribe(callback)
  }

  onStatusChangeDown (callback: EmptyCallback): void {
    this._changeDownSubscriber.subscribe(callback)
  }

  waitForStatusDownWithTimeout (): Promise<void> {
    return onFirstEventOrTimeout(this.onStatusDown.bind(this), MYSTERIUM_CLIENT_WAITING_THRESHOLD)
  }

  waitForNewStatusDownWithTimeout (): Promise<void> {
    return onFirstEventOrTimeout(this.onNewStatusDown.bind(this), MYSTERIUM_CLIENT_WAITING_THRESHOLD)
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
    if (!this._isStarted) {
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
