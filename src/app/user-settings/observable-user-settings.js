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

import type { FavoriteProviders, UserSettings } from './user-settings'
import Subscriber from '../../libraries/subscriber'
import type { UserSettingName } from './user-settings-store'
import type { Callback } from '../../libraries/subscriber'
import { userSettingName } from './user-settings-store'

function getDefaultSettings (): UserSettings {
  return {
    showDisconnectNotifications: true,
    favoriteProviders: new Set()
  }
}

/**
 * Keeps user settings and notifies subscribers when settings change.
 */
class ObservableUserSettings {
  _settings: UserSettings = getDefaultSettings()
  _listeners: {
    showDisconnectNotifications: Subscriber<boolean>,
    favoriteProviders: Subscriber<FavoriteProviders>
  } = {
    showDisconnectNotifications: new Subscriber(),
    favoriteProviders: new Subscriber()
  }

  getAll (): UserSettings {
    return this._settings
  }

  onChange (property: UserSettingName, cb: Callback<any>) {
    this._listeners[property].subscribe(cb)
  }

  // TODO: notify only when property changes
  _changeSettings (settings: UserSettings) {
    this._settings = settings
    this._notify(userSettingName.showDisconnectNotifications)
    this._notify(userSettingName.favoriteProviders)
  }

  _notify (propertyChanged: UserSettingName) {
    const newVal = ((this._settings[propertyChanged]): any)
    this._listeners[propertyChanged].notify(newVal)
  }
}

export default ObservableUserSettings
