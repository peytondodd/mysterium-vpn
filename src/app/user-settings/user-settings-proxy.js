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
import type { FavoriteProviders, UserSettings } from './user-settings'
import type { Callback } from '../../libraries/subscriber'
import Subscriber from '../../libraries/subscriber'
import type { UserSettingName, UserSettingsStore } from './user-settings-store'
import { getDefaultSettings, userSettingName } from './user-settings-store'

class UserSettingsProxy implements UserSettingsStore {
  _communication: RendererCommunication
  _settings: UserSettings = getDefaultSettings()
  _settingsListener: ?((UserSettings) => void) = null

  // TODO: DRY
  _listeners: {
    showDisconnectNotifications: Subscriber<boolean>,
    favoriteProviders: Subscriber<FavoriteProviders>
  } = {
    showDisconnectNotifications: new Subscriber(),
    favoriteProviders: new Subscriber()
  }

  constructor (communication: RendererCommunication) {
    this._communication = communication
  }

  startListening () {
    this._settingsListener = (settings) => this._updateLocalUserSettings(settings)
    this._communication.onUserSettings(this._settingsListener)
  }

  stopListening () {
    if (this._settingsListener == null) {
      throw new Error('UserSettingsProxy.deinitilize invoked without initialization')
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

  getAll (): UserSettings {
    return this._settings
  }

  onChange (property: UserSettingName, cb: Callback<any>) {
    this._listeners[property].subscribe(cb)
  }

  _updateLocalUserSettings (settings: UserSettings) {
    this._settings = settings
    this._notify(userSettingName.showDisconnectNotifications)
    this._notify(userSettingName.favoriteProviders)
  }

  _notify (propertyChanged: UserSettingName) {
    const newVal = ((this._settings[propertyChanged]): any)
    this._listeners[propertyChanged].notify(newVal)
  }
}

export { UserSettingsProxy }
