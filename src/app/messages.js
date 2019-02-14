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

export default {
  connectFailed: 'Connection failed. Try another country',
  countryListIsEmpty: 'No countries available',
  locationNotSelected: 'Please select location',
  initializationError: {
    message: 'Failed to load MysteriumVPN'
  },
  identityListFailed: 'Identity list fetching failed',
  identityCreateFailed: 'Identity creation failed',
  identityUnlockFailed: 'Identity unlocking failed',
  processInstallationPermissionsError: 'Failed to install MysteriumVPN. Please restart the app and grant permissions.',
  processInstallationError: 'Failed to install MysteriumVPN.',
  processStartError: 'Failed to start mysterium_client daemon. Please restart the app and try again.',
  termsAcceptError: 'Failed to make a local copy of terms and conditions. Please restart the app and try again.',
  mysteriumCLientDown: {
    message: 'mysterium_client is down',
    hint: 'Please give it a moment to boot. If this message persists try restarting the app or please contact support'
  },
  connectionStatusFailed: 'Error fetching connection status',
  connectionStatisticsFailed: 'Error fetching connection statistics',
  disconnectFailed: 'Error disconnecting'
}
