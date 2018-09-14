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
import type { ConnectionRecord, UserSettings } from './user-settings'
import type { Callback } from '../../libraries/subscriber'

const userSettingName = {
  showDisconnectNotifications: 'showDisconnectNotifications',
  favoriteProviders: 'favoriteProviders',
  connectionRecords: 'connectionRecords'
}

type UserSettingName = $Values<typeof userSettingName>

// TODO: use interface everywhere
interface UserSettingsStore {
  addConnectionRecord (connection: ConnectionRecord): void,
  setFavorite (id: string, isFavorite: boolean): void,
  getAll (): UserSettings,
  onChange (property: UserSettingName, cb: Callback<any>): void
}

function getDefaultSettings (): UserSettings {
  return {
    showDisconnectNotifications: true,
    favoriteProviders: new Set(),
    connectionRecords: []
  }
}

export type { UserSettingsStore, UserSettingName }
export { userSettingName, getDefaultSettings }
