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

import logger from '../app/logger'
import type { Subscriber } from './publisher'
import Publisher from './publisher'

/**
 * Stores value and allows subscribing to value changes.
 */
class Observable<T> {
  _value: T
  _publisher: Publisher<T> = new Publisher()

  get value (): T {
    return this._value
  }

  set value (value: T) {
    if (JSON.stringify(value) === JSON.stringify(this._value)) {
      return
    }
    this._value = value
    this._publisher.publish(value)
  }

  constructor (initialValue: T) {
    this._value = initialValue
  }

  addSubscriber (callback: Subscriber<T>) {
    this._publisher.addSubscriber(callback)
    try {
      callback(this._value)
    } catch (err) {
      logger.error('Callback call in Observable failed', err)
    }
  }

  removeSubscriber (callback: Subscriber<T>) {
    this._publisher.removeSubscriber(callback)
  }
}

export { Observable }
