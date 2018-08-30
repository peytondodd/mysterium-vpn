/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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

import ConnectionRequestDTO from '../../libraries/mysterium-tequilapi/dto/connection-request'
import type { ErrorMessage } from './error-message'
import ConsumerLocationDTO from '../../libraries/mysterium-tequilapi/dto/consumer-location'
import { FunctionLooper } from '../../libraries/function-looper'
import type { ConnectionState } from './connection-state'
import type { ConnectionStatsFetcher } from './connection-stats-fetcher'

interface ConnectionEstablisher {
  connect (
    request: ConnectionRequestDTO,
    connectionState: ConnectionState,
    errorMessage: ErrorMessage,
    location: ?ConsumerLocationDTO,
    actionLooper: ?FunctionLooper): Promise<void>,
  disconnect (
    connectionState: ConnectionState,
    connectionStatsFetcher: ConnectionStatsFetcher,
    errorMessage: ErrorMessage,
    actionLoopers: ?FunctionLooper): Promise<void>
}

export type { ConnectionEstablisher }
