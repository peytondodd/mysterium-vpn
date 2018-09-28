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
import type { MessageReceiver } from './message-transport'

type Callback = (data: any) => void
type Subscriber = (Callback) => void

/**
 * Subscribes for specific event and resolves when first event is received.
 *
 * @param subscriber - function to subscribe for specific event
 *
 * @returns {Promise<any>}
 */
function onFirstEvent (subscriber: Subscriber): Promise<any> {
  return new Promise((resolve) => {
    subscriber((data) => {
      resolve(data)
    })
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
function onFirstEventOrTimeout (subscriber: Subscriber, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Promise timed out after ${timeout} ms`)),
      timeout
    )

    subscriber((data) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

// TODO: test
function onceOnMessage<T> (receiver: MessageReceiver<T>, callback: T => void) {
  const wrapperCallback = (data: T) => {
    callback(data)
    receiver.removeCallback(wrapperCallback)
  }
  receiver.on(wrapperCallback)
}

export { onFirstEvent, onFirstEventOrTimeout, onceOnMessage }
