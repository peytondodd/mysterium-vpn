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
import CommunicationBindings from '../../../src/app/communication-bindings'
import StartupEventTracker from '../../../src/app/statistics/startup-event-tracker'
import MockEventSender from '../../helpers/statistics/mock-event-sender'
import SubscribableMessageBus from '../../helpers/subscribable-message-bus'
import messages from '../../../src/app/communication/messages'
import BugReporterMock from '../../helpers/bug-reporter-mock'
import { UserSettingsStorage } from '../../../src/app/user-settings/user-settings-storage'
import Notification from '../../../src/app/notification'
import { ConnectionStatus } from 'mysterium-tequilapi/lib/dto/connection-status'
import { buildMainCommunication } from '../../../src/app/communication/main-communication'

class UserSettingsStoreMock extends UserSettingsStorage {
  saveWasCalled: boolean = false

  async _save (): Promise<void> {
    this.saveWasCalled = true
  }
}

class NotificationMock extends Notification {
  showWasCalled: boolean = false

  show () {
    this.showWasCalled = true
  }
}

describe('CommunicationBindings', () => {
  let msgBus, comBinds

  beforeEach(() => {
    msgBus = new SubscribableMessageBus()
    const communication = buildMainCommunication(msgBus)
    comBinds = new CommunicationBindings(communication)
  })

  describe('.showNotificationOnDisconnect', () => {
    let userSettingsStore, notif

    beforeEach(() => {
      userSettingsStore = new UserSettingsStoreMock('some path')
      notif = new NotificationMock('title', 'subtitle', 'icon path')
    })

    it('it shows notification when disconnected without user interaction', () => {
      comBinds.showNotificationOnDisconnect(userSettingsStore, notif)
      msgBus.triggerOn(messages.CONNECTION_STATUS_CHANGED, {
        oldStatus: ConnectionStatus.CONNECTED,
        newStatus: ConnectionStatus.NOT_CONNECTED
      })

      expect(notif.showWasCalled).to.be.true
    })

    it('it does not show notification when disconnecting with notifications disabled', async () => {
      await userSettingsStore.setShowDisconnectNotifications(false)
      comBinds.showNotificationOnDisconnect(userSettingsStore, notif)
      msgBus.triggerOn(messages.CONNECTION_STATUS_CHANGED, {
        oldStatus: ConnectionStatus.CONNECTED,
        newStatus: ConnectionStatus.NOT_CONNECTED
      })

      expect(notif.showWasCalled).to.be.false
    })
  })

  describe('.syncFavorites', () => {
    const userSettingsStore = new UserSettingsStoreMock('some path')

    it('saves favorite using userSettingsStore', async () => {
      comBinds.syncFavorites(userSettingsStore)
      msgBus.triggerOn(messages.TOGGLE_FAVORITE_PROVIDER, { id: 'some', isFavorite: true })

      expect(userSettingsStore.getAll().favoriteProviders.has('some')).to.be.true
      expect(userSettingsStore.saveWasCalled).to.be.true
    })
  })

  describe('.syncShowDisconnectNotifications', () => {
    const userSettingsStore = new UserSettingsStoreMock('some path')

    it('sends user settings when requested', () => {
      comBinds.syncShowDisconnectNotifications(userSettingsStore)
      msgBus.triggerOn(messages.USER_SETTINGS_REQUEST)

      expect(msgBus.sentData[0].channel).to.eql(messages.USER_SETTINGS)
      expect(msgBus.sentData[0].data).to.eql({
        showDisconnectNotifications: true,
        favoriteProviders: new Set()
      })
    })

    it('saves disconnect notification setting that was received from communication', () => {
      comBinds.syncShowDisconnectNotifications(userSettingsStore)
      msgBus.triggerOn(messages.SHOW_DISCONNECT_NOTIFICATION, false)
      expect(userSettingsStore.saveWasCalled).to.be.true
      expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.false
    })
  })

  describe('.setCurrentIdentityForEventTracker', () => {
    const evtSender = new MockEventSender()
    const startupEventTracker = new StartupEventTracker(evtSender)

    it('sends event once', () => {
      comBinds.setCurrentIdentityForEventTracker(startupEventTracker)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(evtSender.events.length).to.eql(1)
      expect(evtSender.events[0].eventName).to.eql('runtime_environment_details')
      expect(evtSender.events[0].context.identity).to.eql('some data')

      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })
      expect(evtSender.events.length).to.eql(1)
    })
  })

  describe('.syncCurrentIdentityForBugReporter', () => {
    const bugReporter = new BugReporterMock()

    it('calls .setUser() for bugReporter', () => {
      comBinds.syncCurrentIdentityForBugReporter(bugReporter)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(bugReporter.identity).to.eql({ id: 'some data' })
    })
  })
})
