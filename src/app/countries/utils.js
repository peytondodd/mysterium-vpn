/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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
import countries from './list'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import type { FavoriteProviders } from '../user-settings/user-settings'
import { Metrics, QualityCalculator, QualityLevel } from 'mysterium-vpn-js'

const COUNTRY_NAME_UNRESOLVED = 'N/A'
const COUNTRY_CODE_LENGTH = 2

type Country = {
  id: string,
  code: ?string,
  name: string,
  isFavorite: boolean,
  // TODO: rename to 'quality'
  successRate: number | null,
  qualityLevel: QualityLevel,
  trusted: boolean
}

function getCountryLabel (country: Country, maxNameLength: ?number = null, maxIdentityLength: ?number = 9) {
  const identity = limitedLengthString(country.id, maxIdentityLength)
  let title = limitedLengthString(country.name, maxNameLength)
  if (title === COUNTRY_NAME_UNRESOLVED && country.code) {
    title += ` ${limitedLengthString(country.code, COUNTRY_CODE_LENGTH)}`
  }

  return `${title} (${identity})`
}

function getSortedCountryListFromProposals (
  proposals: Array<ProposalDTO>,
  favorites: FavoriteProviders): Array<Country> {
  const countries = proposals.map(getCountryFromProposal).map(countryFavoriteMapper(favorites))
  return countries.sort(compareCountries)
}

function limitedLengthString (value: string, maxLength: ?number = null): string {
  if (maxLength && value.length > maxLength) {
    return value.substring(0, maxLength) + '..'
  }
  return value
}

function countryFavoriteMapper (favorites: FavoriteProviders): (Country) => Country {
  return (country: Country) => {
    return { ...country, isFavorite: favorites.has(country.id) }
  }
}

function isProposalTrusted (proposal: ProposalDTO): boolean {
  if (proposal.metrics && proposal.metrics.connectCount) {
    const count = proposal.metrics.connectCount
    if (count.success === 0 && count.fail > 0) {
      return false
    }
  }
  return true
}

function getCountryFromProposal (proposal: ProposalDTO): Country {
  const calculator = new QualityCalculator()
  const successRate = calculator.calculateValue(getMetrics(proposal))
  const qualityLevel = calculator.calculateLevel(successRate)
  const trusted = isProposalTrusted(proposal)

  return {
    id: proposal.providerId,
    code: getCountryCodeFromProposal(proposal),
    name: getCountryNameFromProposal(proposal),
    isFavorite: false,
    successRate,
    qualityLevel,
    trusted
  }
}

function compareCountries (a: Country, b: Country) {
  if (a.isFavorite && !b.isFavorite) {
    return -1
  }
  if (!a.isFavorite && b.isFavorite) {
    return 1
  }

  if (a.successRate !== null || b.successRate !== null) {
    if (a.successRate !== null && b.successRate !== null) {
      if (a.successRate < b.successRate) {
        return 1
      }
      if (b.successRate < a.successRate) {
        return -1
      }
    } else {
      if (a.successRate === null) {
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

function isCountryKnown (countryCode: ?string): boolean {
  return countryCode != null &&
    typeof countries[countryCode.toLocaleLowerCase()] !== 'undefined'
}

function getCountryName (countryCode: string): string {
  countryCode = countryCode.toLowerCase()
  if (!isCountryKnown(countryCode)) {
    return COUNTRY_NAME_UNRESOLVED
  }

  return countries[countryCode]
}

function getCountryNameFromProposal (proposal: ProposalDTO): string {
  const countryCode = getCountryCodeFromProposal(proposal)
  if (!countryCode) {
    return COUNTRY_NAME_UNRESOLVED
  }

  return getCountryName(countryCode)
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

export type { Country }
export {
  getCountryLabel,
  getSortedCountryListFromProposals,
  isCountryKnown,
  isProposalTrusted
}
