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
import type { ConnectionRecord, FavoriteProviders, UserSettings } from './user-settings'
import type { Callback } from '../../libraries/subscriber'
import Subscriber from '../../libraries/subscriber'
import type { UserSettingName, UserSettingsStore } from './user-settings-store'
import { getDefaultSettings, userSettingName } from './user-settings-store'

class UserSettingsProxy implements UserSettingsStore {
  _communication: RendererCommunication
  _settings: UserSettings = getDefaultSettings()

  // TODO: DRY
  _listeners: {
    showDisconnectNotifications: Subscriber<boolean>,
    favoriteProviders: Subscriber<FavoriteProviders>,
    connectionRecords: Subscriber<ConnectionRecord[]>
  } = {
    showDisconnectNotifications: new Subscriber(),
    favoriteProviders: new Subscriber(),
    connectionRecords: new Subscriber()
  }

  constructor (communication: RendererCommunication) {
    this._communication = communication
    this._communication.onUserSettings((settings) => {
      this._settings = settings
      this._notify(userSettingName.showDisconnectNotifications)
      this._notify(userSettingName.connectionRecords)
      this._notify(userSettingName.favoriteProviders)
    })
  }

  addConnectionRecord (connection: ConnectionRecord) {
    this._communication.sendConnectionRecord(connection)
  }

  setFavorite (id: string, isFavorite: boolean): void {
    this._communication.sendToggleFavoriteProvider({ id, isFavorite })
  }

  getAll (): UserSettings {
    return this._settings
  }

  onChange (property: UserSettingName, cb: Callback<any>) {
    this._listeners[property].subscribe(cb)
  }

  _notify (propertyChanged: UserSettingName) {
    const newVal = ((this._settings[propertyChanged]): any)
    this._listeners[propertyChanged].notify(newVal)
  }
}

export { UserSettingsProxy }
