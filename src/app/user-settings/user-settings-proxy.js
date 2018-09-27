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

import type { UserSettings } from './user-settings'
import type { UserSettingsStore } from './user-settings-store'
import ObservableUserSettings from './observable-user-settings'
import type { RendererTransport } from '../communication/transport/renderer-transport'

/**
 * Caches local settings synced via communication channel, and notifies when settings change.
 */
class UserSettingsProxy extends ObservableUserSettings implements UserSettingsStore {
  _transport: RendererTransport
  _settingsListener: ?((UserSettings) => void) = null

  constructor (transport: RendererTransport) {
    super()
    this._transport = transport
  }

  startListening () {
    this._settingsListener = settings => this._updateAllProperties(settings)
    this._transport.userSettingsReceiver.on(this._settingsListener)
    this._transport.userSettingsRequestSender.send()
  }

  stopListening () {
    if (this._settingsListener == null) {
      throw new Error('UserSettingsProxy.stopListening invoked without initialization')
    }
    this._transport.userSettingsReceiver.removeCallback(this._settingsListener)
    this._settingsListener = null
  }

  async setFavorite (id: string, isFavorite: boolean) {
    this._transport.toggleFavoriteProviderSender.send({ id, isFavorite })
  }

  async setShowDisconnectNotifications (show: boolean) {
    this._transport.showDisconnectNotificationSender.send(show)
  }
}

export { UserSettingsProxy }
