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
import { Observable } from '../../libraries/observable'
import type { UserSettingName } from './user-settings-store'
import type { Callback } from '../../libraries/subscriber'
import { userSettingName } from './user-settings-store'

function getDefaultSettings (): UserSettings {
  return {
    showDisconnectNotifications: true,
    favoriteProviders: new Set()
  }
}

type ObservableSettings = {
  showDisconnectNotifications: Observable<boolean>,
  favoriteProviders: Observable<FavoriteProviders>
}

/**
 * Keeps user settings and notifies subscribers when settings change.
 */
class ObservableUserSettings {
  _settings: UserSettings = getDefaultSettings()
  _observables: ObservableSettings

  constructor () {
    this._observables = this._buildObservables()
  }

  getAll (): UserSettings {
    const settings = {}
    this._getProperties().forEach(property => {
      settings[property] = this._getPropertyValue(property)
    })
    return (settings: any)
  }

  onChange (property: UserSettingName, callback: Callback<any>) {
    this._observables[property].subscribe(callback)
  }

  removeOnChange (property: UserSettingName, callback: Callback<any>) {
    this._observables[property].unsubscribe(callback)
  }

  _buildObservables (): ObservableSettings {
    const observables = {}
    this._getProperties().forEach(setting => {
      observables[setting] = new Observable(this._getPropertyValue(setting))
    })
    return (observables: any)
  }

  _getProperties (): UserSettingName[] {
    return (Object.values(userSettingName): any)
  }

  // TODO: notify only when property changes
  _changeSettings (settings: UserSettings) {
    this._settings = settings
    this._notify(userSettingName.showDisconnectNotifications)
    this._notify(userSettingName.favoriteProviders)
  }

  _notify (propertyChanged: UserSettingName) {
    const newVal = this._getPropertyValue(propertyChanged)
    this._observables[propertyChanged].value = newVal
  }

  _getPropertyValue (property: UserSettingName): any {
    return ((this._settings[property]): any)
  }
}

export default ObservableUserSettings
