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

import logger from './logger'

type Callback = (data: any) => void
type Unsubscriber = () => void
type Subscriber = (Callback) => Unsubscriber

/**
 * Subscribes for specific event and resolves when first event is received.
 *
 * @param subscriber - function to subscribe for specific event
 *
 * @returns {Promise<any>}
 */
function onFirstEvent (subscriber: Subscriber): Promise<any> {
  return new Promise((resolve) => {
    let eventReceived = false
    let unsubscriber: ?Unsubscriber = null

    unsubscriber = subscriber((data) => {
      if (unsubscriber != null) {
        unsubscriber()
      } else {
        eventReceived = true
      }
      resolve(data)
    })

    if (eventReceived) {
      unsubscriber()
    }
  })
}

/**
 * Subscribes for specific event and resolves when first event is received.
 *
 * @param subscriber - function to subscribe for specific event
 * @param timeout - timeout in miliseccons
 *
 * @returns {Promise<any>}
 */
function onFirstEventOrTimeout (subscriber: Subscriber, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let eventReceived = false
    let unsubscriber: ?Unsubscriber = null

    const timer = setTimeout(
      () => {
        if (eventReceived) {
          return
        }

        reject(new Error(`Promise timed out after ${timeout} ms`))

        if (unsubscriber == null) {
          logger.error('Expected unsubscriber to be set in onFirstEventOrTimeout')
          return
        }
        unsubscriber()
      },
      timeout
    )

    unsubscriber = subscriber((data) => {
      clearTimeout(timer)
      if (unsubscriber != null) {
        unsubscriber()
      } else {
        eventReceived = true
      }
      resolve(data)
    })

    if (eventReceived) {
      unsubscriber()
    }
  })
}

export { onFirstEvent, onFirstEventOrTimeout }
