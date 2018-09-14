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
import { userSettingName } from '../../../../src/app/user-settings/user-settings-store'
import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import { CallbackRecorder } from '../../../helpers/utils'
import type { ConnectionRecord, UserSettings } from '../../../../src/app/user-settings/user-settings'
import { connectionStatuses } from '../../../../src/app/user-settings/user-settings'
import RendererCommunication from '../../../../src/app/communication/renderer-communication'
import FakeMessageBus from '../../../helpers/fake-message-bus'
import messages from '../../../../src/app/communication/messages'
import { UserSettingsProxy } from '../../../../src/app/user-settings/user-settings-proxy'

describe('UserSettingsProxy', () => {
  let msgBus, com
  let settingsProxy

  beforeEach(() => {
    msgBus = new FakeMessageBus()
    com = new RendererCommunication(msgBus)
    settingsProxy = new UserSettingsProxy(com)
  })

  describe('.addConnectionRecord', () => {
    it('sends request to communication', () => {
      const conn: ConnectionRecord = { country: 'lt', status: connectionStatuses.successful }
      settingsProxy.addConnectionRecord(conn)
      expect(msgBus.lastChannel).to.eql(messages.ADD_CONNECTION_RECORD)
    })
  })

  describe('.getAll', () => {
    it('returns default settings initially', () => {
      const defaultSettings: UserSettings = {
        showDisconnectNotifications: true,
        favoriteProviders: new Set(),
        connectionRecords: []
      }
      expect(settingsProxy.getAll()).to.eql(defaultSettings)
    })

    it('returns settings received from communication', () => {
      const updatedSettings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set(),
        connectionRecords: [{
          country: 'lt',
          status: connectionStatuses.successful
        }]
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(settingsProxy.getAll()).to.eql(updatedSettings)
    })
  })

  describe('.setFavorite', () => {
    it('sends message to change favorite', () => {
      settingsProxy.setFavorite('provider id', true)
      expect(msgBus.lastChannel).to.eql(messages.TOGGLE_FAVORITE_PROVIDER)
      expect(msgBus.lastData).to.eql({ id: 'provider id', isFavorite: true })
    })
  })

  describe('.onChange', () => {
    let recorder

    beforeEach(() => {
      recorder = new CallbackRecorder()
    })

    it('notifies about notification setting change', () => {
      settingsProxy.onChange(userSettingName.showDisconnectNotifications, recorder.getCallback())

      const updatedSettings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set(),
        connectionRecords: []
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invoked).to.be.true
      expect(recorder.firstArgument).to.be.false
    })

    it('notifies about connection records change', () => {
      settingsProxy.onChange(userSettingName.connectionRecords, recorder.getCallback())

      const connectionRecords = [
        { country: 'us', status: connectionStatuses.successful }
      ]
      const updatedSettings: UserSettings = {
        showDisconnectNotifications: true,
        favoriteProviders: new Set(),
        connectionRecords
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invoked).to.be.true
      expect(recorder.firstArgument).to.eql(connectionRecords)
    })

    it('notifies about favorite providers change', () => {
      settingsProxy.onChange(userSettingName.favoriteProviders, recorder.getCallback())

      const favoriteProviders = new Set('new provider')
      const updatedSettings: UserSettings = {
        showDisconnectNotifications: true,
        favoriteProviders: favoriteProviders,
        connectionRecords: []
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invoked).to.be.true
      expect(recorder.firstArgument).to.eql(favoriteProviders)
    })
  })
})
