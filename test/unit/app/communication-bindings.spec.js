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

import { describe, expect, it } from '../../helpers/dependencies'
import CommunicationBindings from '../../../src/app/communication-bindings'
import StartupEventTracker from '../../../src/app/statistics/startup-event-tracker'
import MockEventSender from '../../helpers/statistics/mock-event-sender'
import MainMessageBusCommunication from '../../../src/app/communication/main-message-bus-communication'
import SubscribableMessageBus from '../../helpers/subscribable-message-bus'
import messages from '../../../src/app/communication/messages'

describe('CommunicationBindings', () => {
  let msgBus = new SubscribableMessageBus()
  let com = new MainMessageBusCommunication(msgBus)
  let comBinds = new CommunicationBindings(com)

  describe('.setCurrentIdentityForEventTracker()', () => {
    const evtSender = new MockEventSender()
    const startupEventTracker = new StartupEventTracker(evtSender)

    it('sends event', () => {
      comBinds.setCurrentIdentityForEventTracker(startupEventTracker)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(evtSender.events[0].eventName).to.eql('runtime_environment_details')
      expect(evtSender.events[0].context.identity).to.eql('some data')
    })
  })
})
