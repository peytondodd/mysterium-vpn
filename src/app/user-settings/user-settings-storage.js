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

import type { UserSettingsStore } from './user-settings-store'
import { userSettingName } from './user-settings-store'
import { loadSettings, saveSettings } from './storage'
import ObservableUserSettings from './observable-user-settings'

/**
 * Stores settings locally and in file.
 */
// TODO: changing settings should send update to communication
class UserSettingsStorage extends ObservableUserSettings implements UserSettingsStore {
  _path: string

  constructor (path: string) {
    super()
    this._path = path
  }

  /**
   *
   * @returns {Promise<boolean>} true if loading was done, false if file does not exist
   */
  async load (): Promise<boolean> {
    let parsed
    try {
      parsed = await loadSettings(this._path)
    } catch (e) {
      if (isFileNotExistError(e)) {
        return false
      }
      throw e
    }
    this._updateAllProperties(parsed)
    return true
  }

  async setFavorite (id: string, isFavorite: boolean) {
    const oldProviders = this._getPropertyValue(userSettingName.favoriteProviders)
    if (isFavorite === oldProviders.has(id)) {
      return // nothing changed
    }

    const newProviders = new Set(oldProviders)

    if (isFavorite) newProviders.add(id)
    else newProviders.delete(id)
    this._updateProperty(userSettingName.favoriteProviders, newProviders)
    await this._save()
  }

  async setShowDisconnectNotifications (show: boolean) {
    this._updateProperty(userSettingName.showDisconnectNotifications, show)
    await this._save()
  }

  async _save () {
    return saveSettings(this._path, this.getAll())
  }
}

function isFileNotExistError (error: Object): boolean {
  return (error.code && error.code === 'ENOENT')
}

export { UserSettingsStorage }
