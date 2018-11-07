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

/**
 * Names of all events which this application send.
 */
const EVENT_NAMES = {
  STARTUP: 'runtime_environment_details',
  APP_START: 'app_start',
  APP_START_SUCCESS: 'app_start_success',

  CLIENT_STARTED: 'client_started',

  CONNECT_SUCCESSFUL: 'connect_successful',
  CONNECT_CANCELED: 'connect_canceled',
  CONNECT_FAILED: 'connect_failed'
}

export default EVENT_NAMES
