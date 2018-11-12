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

// TODO: fix file name

import { onceOnMessage } from '../../../../src/app/communication/utils'
import { onFirstEvent, onFirstEventOrTimeout } from '../../../../src/app/events'
import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import MessageTransport from '../../../../src/app/communication/message-transport'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { captureAsyncError, RepeatableCallbackRecorder } from '../../../helpers/utils'
import { MessageReceiver } from '../../../../src/app/communication/message-receiver'
import { MessageSender } from '../../../../src/app/communication/message-sender'

describe('utils', () => {
  describe('.onFirstEvent', () => {
    it('resolves once serial data is passed to callback', async () => {
      const subscribe = (onResolve) => {
        onResolve('resolution of instant data')
        return () => {}
      }

      const resolvedData = await onFirstEvent(subscribe)
      expect(resolvedData).to.eql('resolution of instant data')
    })

    it('unsubscribes from listener if event resolves instantly', async () => {
      let unsubscribed = false
      const subscribe = (onResolve) => {
        onResolve('resolution of instant data')
        return () => { unsubscribed = true }
      }

      await onFirstEvent(subscribe)
      expect(unsubscribed).to.be.true
    })

    it('unsubscribes from listener if event resolves later', async () => {
      let unsubscribed = false
      let callback: ?(() => void) = null
      const subscribe = (onResolve) => {
        callback = onResolve
        return () => { unsubscribed = true }
      }

      const promise = onFirstEvent(subscribe)
      expect(unsubscribed).to.be.false
      if (callback == null) {
        throw Error('Expected callback to be set')
      }
      callback()
      await promise
      expect(unsubscribed).to.be.true
    })
  })

  describe('.onFirstEventOrTimeout', () => {
    it('unsubscribes from listener if event resolves instantly', async () => {
      let unsubscribed = false
      const subscribe = (onResolve) => {
        onResolve('resolution of instant data')
        return () => { unsubscribed = true }
      }

      await onFirstEventOrTimeout(subscribe, 1)
      expect(unsubscribed).to.be.true
    })

    it('unsubscribes from listener if event resolves later', async () => {
      let unsubscribed = false
      let callback: ?(() => void) = null
      const subscribe = (onResolve) => {
        callback = onResolve
        return () => { unsubscribed = true }
      }

      const promise = onFirstEventOrTimeout(subscribe, 1)
      expect(unsubscribed).to.be.false
      if (callback == null) {
        throw Error('Expected callback to be set')
      }
      callback()
      await promise
      expect(unsubscribed).to.be.true
    })

    it('unsubscribes from listener when waiting timeouts', async () => {
      let unsubscribed = false
      const subscribe = (_onResolve) => {
        return () => { unsubscribed = true }
      }

      const promise = onFirstEventOrTimeout(subscribe, 1)
      await captureAsyncError(() => promise)
      expect(unsubscribed).to.be.true
    })
  })

  describe('.onceOnMessage', () => {
    let sender: MessageSender<string>
    let receiver: MessageReceiver<string>
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      const messageBus = new DirectMessageBus()
      const transport = new MessageTransport('channel', messageBus)
      sender = transport.buildSender()
      receiver = transport.buildReceiver()
      recorder = new RepeatableCallbackRecorder()
    })

    it('triggers callback', () => {
      onceOnMessage(receiver, recorder.getCallback())
      sender.send('some data')
      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not trigger callback the second time', () => {
      onceOnMessage(receiver, recorder.getCallback())
      sender.send('some data')
      sender.send('some data')
      expect(recorder.invokesCount).to.eql(1)
    })
  })
})
