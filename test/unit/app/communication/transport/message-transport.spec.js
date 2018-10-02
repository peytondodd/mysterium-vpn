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
import MessageTransport from '../../../../../src/app/communication/message-transport'
import DirectMessageBus from '../../../../helpers/direct-message-bus'
import { MessageReceiver } from '../../../../../src/app/communication/message-receiver'
import { MessageSender } from '../../../../../src/app/communication/message-sender'

describe('MessageTransport', () => {
  let transport

  beforeEach(() => {
    const messageBus = new DirectMessageBus()
    transport = new MessageTransport('test channel', messageBus)
  })

  describe('.buildSender', () => {
    it('returns sender', () => {
      const sender = transport.buildSender()
      expect(sender).to.be.instanceof(MessageSender)
    })
  })

  describe('.buildReceiver', () => {
    it('returns receiver', () => {
      const receiver = transport.buildReceiver()
      expect(receiver).to.be.instanceof(MessageReceiver)
    })
  })
})
