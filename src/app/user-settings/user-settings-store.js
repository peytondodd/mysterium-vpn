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
import type { Subscriber } from '../../libraries/publisher'

const userSettingName = {
  showDisconnectNotifications: 'showDisconnectNotifications',
  favoriteProviders: 'favoriteProviders'
}

type UserSettingName = $Values<typeof userSettingName>

interface UserSettingsStore {
  setFavorite (id: string, isFavorite: boolean): Promise<void>,
  setShowDisconnectNotifications (show: boolean): Promise<void>,
  getAll (): UserSettings,
  onChange (property: UserSettingName, callback: Subscriber<any>): void,
  removeOnChange (property: UserSettingName, callback: Subscriber<any>): void
}

export type { UserSettingsStore, UserSettingName }
export { userSettingName }
