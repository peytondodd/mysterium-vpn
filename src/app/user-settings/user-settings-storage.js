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

import type { ConnectionRecord, FavoriteProviders, UserSettings } from './user-settings'
import type { Callback } from '../../libraries/subscriber'
import Subscriber from '../../libraries/subscriber'
import type { UserSettingName, UserSettingsStore } from './user-settings-store'
import { getDefaultSettings, userSettingName } from './user-settings-store'
import { readFile, writeFile } from 'fs'
import { promisify } from 'util'

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

class UserSettingsStorage implements UserSettingsStore {
  _settings: UserSettings = getDefaultSettings()
  _path: string

  _listeners: {
    showDisconnectNotifications: Subscriber<boolean>,
    favoriteProviders: Subscriber<FavoriteProviders>,
    connectionRecords: Subscriber<ConnectionRecord[]>
  } = {
    showDisconnectNotifications: new Subscriber(),
    favoriteProviders: new Subscriber(),
    connectionRecords: new Subscriber()
  }

  constructor (path: string) {
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
    this._settings.favoriteProviders = new Set(parsed.favoriteProviders)
    this._settings.showDisconnectNotifications = parsed.showDisconnectNotifications
    this._settings.connectionRecords = parsed.connectionRecords
    this._notify(userSettingName.favoriteProviders)
    this._notify(userSettingName.showDisconnectNotifications)
    this._notify(userSettingName.connectionRecords)
    return true
  }

  // TODO: make this private
  async save (): Promise<void> {
    return saveSettings(this._path, this._settings)
  }

  async setFavorite (id: string, isFavorite: boolean) {
    if (isFavorite === this._settings.favoriteProviders.has(id)) {
      return // nothing changed
    }

    if (isFavorite) this._settings.favoriteProviders.add(id)
    else this._settings.favoriteProviders.delete(id)
    this._notify(userSettingName.favoriteProviders)
    await this.save()
  }

  async setShowDisconnectNotifications (show: boolean) {
    this._settings.showDisconnectNotifications = show
    this._notify(userSettingName.showDisconnectNotifications)
    await this.save()
  }

  addConnectionRecord (connection: ConnectionRecord) {
    this._settings.connectionRecords.push(connection)
    this._notify(userSettingName.connectionRecords)
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

async function saveSettings (path: string, settings: UserSettings): Promise<void> {
  const settingsString = JSON.stringify(settings)
  await writeFileAsync(path, settingsString)
}

async function loadSettings (path: string): Promise<UserSettings> {
  let data = await readFileAsync(path, { encoding: 'utf8' })
  const parsedSettings = JSON.parse(data)

  if (!validateUserSettings(parsedSettings)) {
    throw new TypeError('UserSettings loading failed. Parsed Object is not of UserSettings type.')
  }

  return parsedSettings
}

function validateUserSettings (settings: Object): boolean {
  return (typeof settings.showDisconnectNotifications === 'boolean')
}

function isFileNotExistError (error: Object): boolean {
  return (error.code && error.code === 'ENOENT')
}

export { UserSettingsStorage }
