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
import { captureError, RepeatableCallbackRecorder } from '../../../helpers/utils'
import type { UserSettings } from '../../../../src/app/user-settings/user-settings'
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

  describe('.startListening', () => {
    it('requests initial settings', () => {
      const proxy = new UserSettingsProxy(com)
      proxy.startListening()

      expect(msgBus.lastChannel).to.eql(messages.USER_SETTINGS_REQUEST)
    })
  })

  describe('.stopListening', () => {
    it('cleans up message bus', () => {
      settingsProxy.startListening()
      settingsProxy.stopListening()
      expect(msgBus.noRemainingCallbacks()).to.be.true
    })

    it('throws error when invoked twice', () => {
      settingsProxy.startListening()
      settingsProxy.stopListening()
      const err = captureError(() => settingsProxy.stopListening())
      if (!(err instanceof Error)) {
        throw new Error('Expected error')
      }
      expect(err.message).to.eql('UserSettingsProxy.stopListening invoked without initialization')
    })

    it('throws error when invoked without initialization', () => {
      const err = captureError(() => settingsProxy.stopListening())
      if (!(err instanceof Error)) {
        throw new Error('Expected error')
      }
      expect(err.message).to.eql('UserSettingsProxy.stopListening invoked without initialization')
    })
  })

  describe('.getAll', () => {
    it('returns default settings initially', () => {
      const defaultSettings: UserSettings = {
        showDisconnectNotifications: true,
        favoriteProviders: new Set()
      }
      expect(settingsProxy.getAll()).to.eql(defaultSettings)
    })

    it('returns settings received from communication', () => {
      settingsProxy.startListening()
      const updatedSettings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set()
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(settingsProxy.getAll()).to.eql(updatedSettings)
    })
  })

  describe('.setFavorite', () => {
    it('sends message to change favorite', async () => {
      await settingsProxy.setFavorite('provider id', true)
      expect(msgBus.lastChannel).to.eql(messages.TOGGLE_FAVORITE_PROVIDER)
      expect(msgBus.lastData).to.eql({ id: 'provider id', isFavorite: true })
    })
  })

  describe('.setShowDisconnectNotifications', () => {
    it('sends message to set value', async () => {
      await settingsProxy.setShowDisconnectNotifications(false)
      expect(msgBus.lastChannel).to.eql(messages.SHOW_DISCONNECT_NOTIFICATION)
      expect(msgBus.lastData).to.eql(false)
    })
  })

  describe('.onChange', () => {
    let recorder

    beforeEach(() => {
      recorder = new RepeatableCallbackRecorder()
      settingsProxy.startListening()
    })

    it('notifies listener instantly with current setting value', () => {
      settingsProxy.onChange(userSettingName.showDisconnectNotifications, recorder.getCallback())
      expect(recorder.invokesCount).to.eql(1)
      expect(recorder.lastArguments).to.eql([true])
    })

    it('does not throw error when callback throws error', () => {
      settingsProxy.onChange(userSettingName.showDisconnectNotifications, () => {
        throw new Error('mock error')
      })
    })

    it('notifies about notification setting change', () => {
      settingsProxy.onChange(userSettingName.showDisconnectNotifications, recorder.getCallback())

      const updatedSettings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set()
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invokesCount).to.eql(2)
      expect(recorder.lastArguments).to.eql([false])
    })

    it('notifies about favorite providers change', () => {
      settingsProxy.onChange(userSettingName.favoriteProviders, recorder.getCallback())

      const favoriteProviders = new Set('new provider')
      const updatedSettings: UserSettings = {
        showDisconnectNotifications: true,
        favoriteProviders: favoriteProviders
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invokesCount).to.eql(2)
      expect(recorder.lastArguments).to.eql([favoriteProviders])
    })
  })

  describe('.removeOnChange', () => {
    it('unsubscribes from change updates', () => {
      const recorder = new RepeatableCallbackRecorder()
      settingsProxy.startListening()
      settingsProxy.onChange(userSettingName.showDisconnectNotifications, recorder.getCallback())
      settingsProxy.removeOnChange(userSettingName.showDisconnectNotifications, recorder.getCallback())

      const updatedSettings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set()
      }
      msgBus.triggerOn(messages.USER_SETTINGS, updatedSettings)
      expect(recorder.invokesCount).to.eql(1)
      expect(recorder.lastArguments).to.eql([true])
    })

    it('throws error when unsubscribing unknown callback', () => {
      settingsProxy.startListening()
      const subscribe = () => { settingsProxy.removeOnChange(userSettingName.showDisconnectNotifications, () => {}) }

      const err = captureError(subscribe)
      if (!(err instanceof Error)) {
        throw new Error('Expected error')
      }
      expect(err.message).to.eql('Callback being unsubscribed was not found')
    })
  })
})
