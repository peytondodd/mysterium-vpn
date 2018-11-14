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

import { beforeEach, describe, expect, it } from '../../helpers/dependencies'
import Publisher from '../../../src/libraries/publisher'
import { captureError } from '../../helpers/utils'

describe('Publisher', () => {
  let publisher: Publisher<string>
  beforeEach(() => {
    publisher = new Publisher()
  })

  it('notifies each event', () => {
    const values: Array<string> = []
    publisher.subscribe((value: string) => {
      values.push(value)
    })

    publisher.notify('hello')
    publisher.notify('world')

    expect(values).to.eql(['hello', 'world'])
  })

  it('notifies multiple subscribers', () => {
    let value1 = null
    let value2 = null
    publisher.subscribe((value: string) => {
      value1 = value
    })
    publisher.subscribe((value: string) => {
      value2 = value
    })

    publisher.notify('hey')

    expect(value1).to.eql('hey')
    expect(value2).to.eql('hey')
  })

  it('notifies all subscribers when first is failing', () => {
    let value1 = null
    let value2 = null
    publisher.subscribe((value: string) => {
      value1 = value
      throw new Error('mock error')
    })
    publisher.subscribe((value: string) => {
      value2 = value
    })

    publisher.notify('hey')

    expect(value1).to.eql('hey')
    expect(value2).to.eql('hey')
  })

  it('returns function which unsubscribes', () => {
    const values: Array<string> = []
    const unsubscribe = publisher.subscribe((value: string) => {
      values.push(value)
    })

    publisher.notify('hello')
    unsubscribe()
    publisher.notify('world')

    expect(values).to.eql(['hello'])
  })

  describe('.unsubscribe', () => {
    it('returns error if unsubscribing twice', () => {
      const cb = () => {}
      publisher.subscribe(cb)
      publisher.unsubscribe(cb)
      const err = captureError(() => publisher.unsubscribe(cb))
      if (!(err instanceof Error)) {
        throw Error('Expected error')
      }
      expect(err.message).to.eql('Callback being unsubscribed was not found')
    })
  })
})
