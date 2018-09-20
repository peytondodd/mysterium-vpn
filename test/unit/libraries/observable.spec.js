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

import { beforeEach, describe, expect, it } from '../../helpers/dependencies'
import { Observable } from '../../../src/libraries/observable'
import { RepeatableCallbackRecorder } from '../../helpers/utils'

describe('Observable', () => {
  describe('.subscribe', () => {
    let observable: Observable<Object>
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      observable = new Observable({ hey: 'how' })
      recorder = new RepeatableCallbackRecorder()
    })

    it('invokes callback instantly with current value', () => {
      observable.subscribe(recorder.getCallback())
      expect(recorder.invokesCount).to.eql(1)
      expect(recorder.lastArguments).to.eql([{ hey: 'how' }])
    })

    it('invokes callback with new value when it changes', () => {
      observable.subscribe(recorder.getCallback())
      observable.value = { hello: 'world' }
      expect(recorder.invokesCount).to.eql(2)
      expect(recorder.lastArguments).to.eql([{ hello: 'world' }])
    })

    it('does not invoke callback when same value is set', () => {
      observable.subscribe(recorder.getCallback())
      observable.value = { hey: 'how' }
      expect(recorder.invokesCount).to.eql(1)
    })
  })
})
