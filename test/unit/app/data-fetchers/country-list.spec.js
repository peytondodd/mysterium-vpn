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
import type { ProposalFetcher } from '../../../../src/app/data-fetchers/proposal-fetcher'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import type { Callback } from '../../../../src/libraries/subscriber'
import { afterEach, beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import CountryList from '../../../../src/app/data-fetchers/country-list'
import { UserSettingsStorage } from '../../../../src/app/user-settings/user-settings-storage'
import { CallbackRecorder } from '../../../helpers/utils'
import { unlinkSyncIfPresent } from '../../../helpers/file-system'

class ProposalFetcherMock implements ProposalFetcher {
  _subscriber: Callback<ProposalDTO[]>
  _data: ProposalDTO[]

  async fetch (): Promise<Array<ProposalDTO>> {
    this._subscriber(this._data)
    return this._data
  }

  onFetchedProposals (cb: Callback<ProposalDTO[]>) {
    this._subscriber = cb
  }

  setFetchData (data: ProposalDTO[]) {
    this._data = data
  }
}

describe('CountryList', () => {
  let countryList, cbRec
  const proposalFetcher = new ProposalFetcherMock()
  const settingsPath = 'settings.json'
  const store = new UserSettingsStorage(settingsPath)

  const proposal1 = [new ProposalDTO({ id: '1', providerId: '0x1', serviceType: 'mock' })]
  const proposal2 = [new ProposalDTO({
    id: '1',
    providerId: '0x2',
    serviceType: 'mock',
    serviceDefinition: { locationOriginate: { country: 'lt' } }
  })]

  beforeEach(() => {
    countryList = new CountryList(proposalFetcher, store)
    cbRec = new CallbackRecorder()
  })

  afterEach(() => {
    unlinkSyncIfPresent(settingsPath)
  })

  describe('.onUpdate', () => {
    it('notifies subscribers with Country each time proposals arrive', () => {
      countryList.onUpdate(cbRec.getCallback())
      proposalFetcher.setFetchData(proposal1)
      proposalFetcher.fetch()
      expect(cbRec.firstArgument).to.be.eql([{ id: '0x1', code: null, name: 'N/A', isFavorite: false }])

      proposalFetcher.setFetchData(proposal2)
      proposalFetcher.fetch()
      expect(cbRec.firstArgument).to.be.eql([{ id: '0x2', code: 'lt', name: 'Lithuania', isFavorite: false }])
    })

    it('notifies subscribers when favorite providers change', async () => {
      proposalFetcher.setFetchData(proposal2)
      proposalFetcher.fetch()

      countryList.onUpdate(cbRec.getCallback())
      await store.setFavorite('0x2', true)
      expect(cbRec.firstArgument).to.be.eql([{ id: '0x2', code: 'lt', name: 'Lithuania', isFavorite: true }])
    })
  })
})
