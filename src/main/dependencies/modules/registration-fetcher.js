/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterium-vpn" Authors.
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

import type { Container } from '../../../app/di'
import TequilapiRegistrationFetcher from '../../../app/data-fetchers/tequilapi-registration-fetcher'

function bootstrap (container: Container) {
  container.constant(
    'registrationFetcher.config',
    {
      'interval': 5000
    }
  )
  container.service(
    'registrationFetcher',
    ['tequilapiClient', 'registrationFetcher.config'],
    (tequilapiClient, config: any) => {
      return new TequilapiRegistrationFetcher(tequilapiClient, config.interval)
    }
  )
}

export default bootstrap
