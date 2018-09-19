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
import type { Container } from '../app/di'
import IdentityRegistrationDTO, { getPaymentLink } from '../libraries/mysterium-tequilapi/dto/identity-registration'

function bootstrap (container: Container) {
  container.constant(
    'paymentBaseUrl',
    process.env.NODE_ENV === 'development'
      ? 'http://wallet-dev.mysterium.network/'
      : 'http://wallet.mysterium.network/'
  )

  container.service(
    'getPaymentLink',
    ['paymentBaseUrl'],
    (paymentBaseUrl: string) =>
      (identityRegistration: IdentityRegistrationDTO) =>
        getPaymentLink(paymentBaseUrl, identityRegistration)
  )
}

export default bootstrap
