/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import type { FavoriteProviders } from '../user-settings/user-settings'
import type { Country } from './country'
import { QualityCalculator, Metrics } from 'mysterium-vpn-js'
import countries from './list'
import { COUNTRY_NAME_UNRESOLVED, isCountryKnown } from './utils'

function getSortedCountryListFromProposals (
  proposals: Array<ProposalDTO>,
  favorites: FavoriteProviders): Array<Country> {
  const countries = proposals.map(getCountryFromProposal).map(countryFavoriteMapper(favorites))
  return countries.sort(compareCountries)
}

function getCountryFromProposal (proposal: ProposalDTO): Country {
  const calculator = new QualityCalculator()
  const quality = calculator.calculateValue(getMetrics(proposal))
  const qualityLevel = calculator.calculateLevel(quality)

  return {
    id: proposal.providerId,
    code: getCountryCodeFromProposal(proposal),
    // TODO: return null instead of setting default value here
    name: getCountryNameFromProposal(proposal) || COUNTRY_NAME_UNRESOLVED,
    isFavorite: false,
    quality,
    qualityLevel
  }
}

function countryFavoriteMapper (favorites: FavoriteProviders): (Country) => Country {
  return (country: Country) => {
    return { ...country, isFavorite: favorites.has(country.id) }
  }
}

function compareCountries (a: Country, b: Country) {
  if (a.isFavorite && !b.isFavorite) {
    return -1
  }
  if (!a.isFavorite && b.isFavorite) {
    return 1
  }

  if (a.quality !== null || b.quality !== null) {
    if (a.quality !== null && b.quality !== null) {
      if (a.quality < b.quality) {
        return 1
      }
      if (b.quality < a.quality) {
        return -1
      }
    } else {
      if (a.quality === null) {
        return 1
      } else {
        return -1
      }
    }
  }

  if (a.name > b.name) {
    return 1
  }
  if (b.name > a.name) {
    return -1
  }

  return 0
}

function getCountryNameFromProposal (proposal: ProposalDTO): ?string {
  const countryCode = getCountryCodeFromProposal(proposal)
  if (!countryCode) {
    return null
  }

  return getCountryName(countryCode)
}

function getCountryName (countryCode: string): ?string {
  countryCode = countryCode.toLowerCase()
  if (!isCountryKnown(countryCode)) {
    return null
  }

  return countries[countryCode]
}

function getCountryCodeFromProposal (proposal: ProposalDTO): ?string {
  if (proposal.serviceDefinition == null) {
    return null
  }
  if (proposal.serviceDefinition.locationOriginate == null) {
    return null
  }
  if (proposal.serviceDefinition.locationOriginate.country == null) {
    return null
  }

  return proposal.serviceDefinition.locationOriginate.country
}

function getMetrics (proposal: ProposalDTO): Metrics {
  if (!proposal.metrics || !proposal.metrics.connectCount) {
    return { connectCount: { success: 0, fail: 0, timeout: 0 } }
  }
  const connectCount = proposal.metrics.connectCount
  return {
    connectCount: {
      success: connectCount.success,
      fail: connectCount.fail,
      timeout: connectCount.timeout
    }
  }
}

export { getSortedCountryListFromProposals }
