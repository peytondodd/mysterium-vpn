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
import type { Country } from '../countries'
import Publisher from '../../libraries/publisher'
import { getSortedCountryListFromProposals } from '../countries'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import type { Callback } from '../../libraries/publisher'
import type { FavoriteProviders } from '../user-settings/user-settings'
import type { ProposalFetcher } from './proposal-fetcher'
import type { UserSettingsStore } from '../user-settings/user-settings-store'
import { userSettingName } from '../user-settings/user-settings-store'

class CountryList {
  _proposalFetcher: ProposalFetcher
  _userSettingsStore: UserSettingsStore
  _publisher: Publisher<Array<Country>> = new Publisher()

  _proposals: ProposalDTO[] = []
  _favorites: FavoriteProviders = new Set()

  constructor (proposalFetcher: ProposalFetcher, store: UserSettingsStore) {
    this._proposalFetcher = proposalFetcher
    this._userSettingsStore = store
    this._subscribeToProposalFetches()
    this._subscribeToFavoriteChanges()
  }

  onUpdate (listener: Callback<Array<Country>>) {
    this._publisher.subscribe(listener)
  }

  _subscribeToFavoriteChanges () {
    this._userSettingsStore.onChange(userSettingName.favoriteProviders, (favorites) => {
      this._favorites = favorites
      this._notify()
    })
  }

  _notify () {
    this._publisher.notify(getSortedCountryListFromProposals(this._proposals, this._favorites))
  }

  _subscribeToProposalFetches () {
    this._proposalFetcher.onFetchedProposals((proposals: ProposalDTO[]) => {
      this._proposals = proposals
      this._notify()
    })
  }
}

export default CountryList
