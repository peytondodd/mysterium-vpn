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

type Callback<T> = (T) => any
type Unsubscribe = () => void

/**
 * Allows subscribing callbacks and publishing data to them.
 */
class Publisher<T> {
  _callbacks: Array<Callback<T>> = []

  subscribe (callback: Callback<T>): Unsubscribe {
    this._callbacks.push(callback)
    return () => { this.unsubscribe(callback) }
  }

  unsubscribe (callback: Callback<T>) {
    const index = this._callbacks.indexOf(callback)
    if (index === -1) {
      throw new Error('Callback being unsubscribed was not found')
    }
    this._callbacks.splice(index, 1)
  }

  notify (data: T) {
    this._callbacks.forEach((callback: Callback<T>) => {
      try {
        callback(data)
      } catch (err) {
        logger.error('Callback call in Publisher failed', err)
      }
    })
  }
}

export type { Callback, Unsubscribe }

export default Publisher
