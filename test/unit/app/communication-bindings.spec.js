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
import MainMessageBusCommunication from '../../../src/app/communication/main-message-bus-communication'
import SubscribableMessageBus from '../../helpers/subscribable-message-bus'
import messages from '../../../src/app/communication/messages'
import TequilapiRegistrationFetcher from '../../../src/app/data-fetchers/tequilapi-registration-fetcher'
import EmptyTequilapiClientMock from '../renderer/store/modules/empty-tequilapi-client-mock'
import FeatureToggle from '../../../src/app/features/feature-toggle'
import BugReporterMock from '../../helpers/bug-reporter-mock'
import FakeMainCommunication from '../../helpers/fake-main-communication'
import factoryTequilapiManipulator from '../../helpers/mysterium-tequilapi/factory-tequilapi-manipulator'
import sleep from '../../../src/libraries/sleep'
import { UserSettingsStore } from '../../../src/app/user-settings/user-settings-store'
import Notification from '../../../src/app/notification'
import ConnectionStatusEnum from '../../../src/libraries/mysterium-tequilapi/dto/connection-status-enum'

class TequilapiRegistrationFetcherMock extends TequilapiRegistrationFetcher {
  startedWithId: ?string

  start (id: string) {
    this.startedWithId = id
    super.start(id)
  }
}

class UserSettingsStoreMock extends UserSettingsStore {
  saveWasCalled: boolean = false

  async save (): Promise<void> {
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
  let msgBus = new SubscribableMessageBus()
  let com = new MainMessageBusCommunication(msgBus)

  describe('showNotificationOnDisconnect', () => {
    let userSettingsStore, notif
    const comBinds = new CommunicationBindings(com)

    beforeEach(() => {
      userSettingsStore = new UserSettingsStoreMock('some path')
      notif = new NotificationMock('title', 'subtitle', 'icon path')
    })

    it('shows notification when connection changes from CONNECTED to NOT_CONNECTED', () => {
      comBinds.showNotificationOnDisconnect(userSettingsStore, notif)
      msgBus.triggerOn(messages.CONNECTION_STATUS_CHANGED, {
        oldStatus: ConnectionStatusEnum.CONNECTED,
        newStatus: ConnectionStatusEnum.NOT_CONNECTED
      })

      expect(notif.showWasCalled).to.be.true
    })

    it('does not show notification when connection changes from CONNECTED to NOT_CONNECTED', () => {
      userSettingsStore.setShowDisconnectNotifications(false)
      comBinds.showNotificationOnDisconnect(userSettingsStore, notif)
      msgBus.triggerOn(messages.CONNECTION_STATUS_CHANGED, {
        oldStatus: ConnectionStatusEnum.CONNECTED,
        newStatus: ConnectionStatusEnum.NOT_CONNECTED
      })

      expect(notif.showWasCalled).to.be.false
    })
  })

  describe('.syncFavorites', () => {
    const userSettingsStore = new UserSettingsStoreMock('some path')

    it('saves favourite using userSettingsStore', async () => {
      const comBinds = new CommunicationBindings(com)
      comBinds.syncFavorites(userSettingsStore)
      msgBus.triggerOn(messages.TOGGLE_FAVORITE_PROVIDER, { id: 'some', isFavorite: true })

      expect(userSettingsStore.getAll().favoriteProviders.has('some')).to.be.true
      expect(userSettingsStore.saveWasCalled).to.be.true
    })
  })

  describe('.syncShowDisconnectNotifications', () => {
    const comBinds = new CommunicationBindings(com)
    const userSettingsStore = new UserSettingsStoreMock('some path')

    it('sends user settings when requested', () => {
      comBinds.syncShowDisconnectNotifications(userSettingsStore)
      msgBus.triggerOn(messages.USER_SETTINGS_REQUEST)

      expect(msgBus.sentData[0].channel).to.eql(messages.USER_SETTINGS)
      expect(msgBus.sentData[0].data).to.eql({ showDisconnectNotifications: true, favoriteProviders: new Set() })
    })

    it('saves disconnect notification setting that was received from communication', () => {
      comBinds.syncShowDisconnectNotifications(userSettingsStore)
      msgBus.triggerOn(messages.SHOW_DISCONNECT_NOTIFICATION, false)
      expect(userSettingsStore.saveWasCalled).to.be.true
      expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.false
    })
  })

  describe('.setCurrentIdentityForEventTracker()', () => {
    const comBinds = new CommunicationBindings(com)
    const evtSender = new MockEventSender()
    const startupEventTracker = new StartupEventTracker(evtSender)

    it('sends event. once.', () => {
      comBinds.setCurrentIdentityForEventTracker(startupEventTracker)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(evtSender.events.length).to.eql(1)
      expect(evtSender.events[0].eventName).to.eql('runtime_environment_details')
      expect(evtSender.events[0].context.identity).to.eql('some data')

      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })
      expect(evtSender.events.length).to.eql(1)
    })
  })

  describe('.startRegistrationFetcherOnCurrentIdentity()', () => {
    const comBinds = new CommunicationBindings(com)
    const regFetcher = new TequilapiRegistrationFetcherMock(new EmptyTequilapiClientMock())
    const featureToggle = new FeatureToggle({ payments: true })

    it('starts registration fetcher. once.', () => {
      comBinds.startRegistrationFetcherOnCurrentIdentity(featureToggle, regFetcher)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(regFetcher.startedWithId).to.eql('some data')

      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some other data' })
      expect(regFetcher.startedWithId).to.eql('some data')
    })
  })

  describe('.syncCurrentIdentityForBugReporter()', () => {
    const comBinds = new CommunicationBindings(com)
    const bugReporter = new BugReporterMock()

    it('calls .setUser() for bugReporter', () => {
      comBinds.syncCurrentIdentityForBugReporter(bugReporter)
      msgBus.triggerOn(messages.CURRENT_IDENTITY_CHANGED, { id: 'some data' })

      expect(bugReporter.identity).to.eql({ id: 'some data' })
    })
  })

  describe('.syncRegistrationStatus()', () => {
    let comFake, comBinds, bugReporter
    beforeEach(() => {
      comFake = new FakeMainCommunication()
      comBinds = new CommunicationBindings(comFake)
      bugReporter = new BugReporterMock()
    })

    it('sends via communication', async () => {
      const regFetcher = new TequilapiRegistrationFetcherMock(factoryTequilapiManipulator().getFakeApi())
      comBinds.syncRegistrationStatus(regFetcher, bugReporter)
      regFetcher.start('someID')
      await sleep(0)

      expect(bugReporter.errorExceptions).to.eql([])
      expect(comFake.wasInvoked(comFake.sendRegistration)).to.be.true
    })

    it('reports error via bugReporter, if one occurs', async () => {
      const fakeTeqFactory = factoryTequilapiManipulator()
      fakeTeqFactory.setIdentityRegistrationFail()
      const fakeTeq = fakeTeqFactory.getFakeApi()
      const regFetcher = new TequilapiRegistrationFetcherMock(fakeTeq, 10)
      comBinds.syncRegistrationStatus(regFetcher, bugReporter)
      regFetcher.start('someID')
      await sleep(1)

      expect(bugReporter.errorExceptions[0].error.message).to.eql('Mock error')
    })
  })
})
