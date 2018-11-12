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
type Unsubscribe = () => void
type Subscribe = (Callback) => Unsubscribe

/**
 * Subscribes for specific event and resolves when first event is received.
 *
 * @param subscribe - function to subscribe for specific event
 *
 * @returns {Promise<any>}
 */
function onFirstEvent (subscribe: Subscribe): Promise<any> {
  return new Promise((resolve) => {
    let eventReceived = false
    let unsubscribe: ?Unsubscribe = null

    unsubscribe = subscribe((data) => {
      if (unsubscribe != null) {
        unsubscribe()
      } else {
        eventReceived = true
      }
      resolve(data)
    })

    if (eventReceived) {
      unsubscribe()
    }
  })
}

/**
 * Subscribes for specific event and resolves when first event is received.
 *
 * @param subscribe - function to subscribe for specific event
 * @param timeout - timeout in miliseccons
 *
 * @returns {Promise<any>}
 */
function onFirstEventOrTimeout (subscribe: Subscribe, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let eventReceived = false
    let unsubscribe: ?Unsubscribe = null

    const timer = setTimeout(
      () => {
        if (eventReceived) {
          return
        }

        reject(new Error(`Promise timed out after ${timeout} ms`))

        if (unsubscribe == null) {
          logger.error('Expected unsubscribe to be set in onFirstEventOrTimeout')
          return
        }
        unsubscribe()
      },
      timeout
    )

    unsubscribe = subscribe((data) => {
      clearTimeout(timer)
      if (unsubscribe != null) {
        unsubscribe()
      } else {
        eventReceived = true
      }
      resolve(data)
    })

    if (eventReceived) {
      unsubscribe()
    }
  })
}

export { onFirstEvent, onFirstEventOrTimeout }
