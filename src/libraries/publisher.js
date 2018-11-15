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

import logger from '../app/logger'

type Subscriber<T> = (T) => any
type Unsubscribe = () => void

/**
 * Allows subscribing callbacks and publishing data to them.
 */
class Publisher<T> {
  _subscribers: Array<Subscriber<T>> = []

  addSubscriber (subscriber: Subscriber<T>): Unsubscribe {
    this._subscribers.push(subscriber)
    return () => { this.removeSubscriber(subscriber) }
  }

  removeSubscriber (subscriber: Subscriber<T>) {
    const index = this._subscribers.indexOf(subscriber)
    if (index === -1) {
      throw new Error('Callback being unsubscribed was not found')
    }
    this._subscribers.splice(index, 1)
  }

  publish (data: T) {
    this._subscribers.forEach((callback: Subscriber<T>) => {
      try {
        callback(data)
      } catch (err) {
        logger.error('Callback call in Publisher failed', err)
      }
    })
  }
}

export type { Subscriber, Unsubscribe }

export default Publisher
