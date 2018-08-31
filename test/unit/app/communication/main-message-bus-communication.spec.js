/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterium-vpn" Authors.
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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import SubscribableMessageBus from '../../../helpers/subscribable-message-bus'
import MainMessageBusCommunication from '../../../../src/app/communication/main-message-bus-communication'
import messages from '../../../../src/app/communication/messages'

describe('MainMessageBusCommunication', () => {
  let messageBus
  let mainCommunication
  const callback = () => {}

  beforeEach(() => {
    messageBus = new SubscribableMessageBus()
    mainCommunication = new MainMessageBusCommunication(messageBus)
  })

  describe('.onCurrentIdentityChangeOnce', () => {
    it('fires once only', () => {
      mainCommunication.onCurrentIdentityChangeOnce(callback)
      expect(messageBus.noRemainingCallbacks()).to.be.false
      messageBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED)

      expect(messageBus.noRemainingCallbacks()).to.be.true
    })
  })
})
