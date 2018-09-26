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

import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import MessageTransport from '../../../../../src/app/communication/transport/message-transport'
import DirectMessageBus from '../../../../helpers/direct-message-bus'
import { CallbackRecorder, captureError } from '../../../../helpers/utils'
import type { MessageBus } from '../../../../../src/app/communication/message-bus'

describe('MessageTransport', () => {
  let messageBus: MessageBus
  let transport: MessageTransport<number>

  beforeEach(() => {
    messageBus = new DirectMessageBus()
    transport = new MessageTransport('test channel', messageBus)
  })

  describe('.send', () => {
    it('triggers receiver', () => {
      const recorder = new CallbackRecorder()
      transport.on(recorder.getCallback())

      transport.send(5)

      expect(recorder.invoked).to.be.true
      expect(recorder.firstArgument).to.eql(5)
    })
  })

  describe('.removeCallback', () => {
    let callback = () => {}

    it('removes added callback', () => {
      transport.on(callback)
      transport.removeCallback(callback)
    })

    it('throws error if callback was not added', () => {
      const err = captureError(() => transport.removeCallback(callback))
      if (!(err instanceof Error)) {
        throw new Error('Expected error')
      }
      expect(err.message).to.eql('Callback being removed was not found')
    })
  })
})
