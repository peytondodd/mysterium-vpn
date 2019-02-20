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
import type { Country } from './country'
import { QualityLevel } from 'mysterium-vpn-js'

const COUNTRY_CODE_LENGTH = 2
const COUNTRY_NAME_UNRESOLVED = 'N/A'

function getCountryLabel (country: Country, maxNameLength: ?number = null, maxIdentityLength: ?number = 9) {
  const identity = limitedLengthString(country.id, maxIdentityLength)
  let title = limitedLengthString(country.name, maxNameLength)
  if (title === COUNTRY_NAME_UNRESOLVED && country.code) {
    title += ` ${limitedLengthString(country.code, COUNTRY_CODE_LENGTH)}`
  }

  return `${title} (${identity})`
}

function limitedLengthString (value: string, maxLength: ?number = null): string {
  if (maxLength && value.length > maxLength) {
    return value.substring(0, maxLength) + '..'
  }
  return value
}

function isCountryKnown (countryCode: ?string): boolean {
  return countryCode != null && !!countries[countryCode.toLowerCase()]
}

function isCountryTrusted (country: Country): boolean {
  return country.qualityLevel === QualityLevel.HIGH || country.qualityLevel === QualityLevel.MEDIUM
}

export {
  getCountryLabel,
  isCountryKnown,
  isCountryTrusted,
  COUNTRY_NAME_UNRESOLVED
}
