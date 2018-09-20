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

import RendererCommunication from '../communication/renderer-communication'
import type { UserSettings } from './user-settings'
import type { UserSettingsStore } from './user-settings-store'
import ObservableUserSettings from './observable-user-settings'

/**
 * Caches local settings synced via communication channel, and notifies when settings change.
 */
class UserSettingsProxy extends ObservableUserSettings implements UserSettingsStore {
  _communication: RendererCommunication
  _settingsListener: ?((UserSettings) => void) = null

  constructor (communication: RendererCommunication) {
    super()
    this._communication = communication
  }

  startListening () {
    this._settingsListener = settings => this._updateAllProperties(settings)
    this._communication.onUserSettings(this._settingsListener)
    this._communication.sendUserSettingsRequest()
  }

  stopListening () {
    if (this._settingsListener == null) {
      throw new Error('UserSettingsProxy.stopListening invoked without initialization')
    }
    this._communication.removeOnUserSettingsCallback(this._settingsListener)
    this._settingsListener = null
  }

  async setFavorite (id: string, isFavorite: boolean) {
    this._communication.sendToggleFavoriteProvider({ id, isFavorite })
  }

  async setShowDisconnectNotifications (show: boolean) {
    this._communication.sendUserSettingsShowDisconnectNotifications(show)
  }
}

export { UserSettingsProxy }
