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

import type { EventSender } from '../../app/statistics/event-sender'
import type { BugReporter } from '../../app/bug-reporting/interface'
import type { TequilapiClient } from '../../libraries/mysterium-tequilapi/client'
import ConnectionRequestDTO from '../../libraries/mysterium-tequilapi/dto/connection-request'
import type { ConnectionStore } from './modules/connection'
import { ConnectEventTracker, currentUserTime } from '../../app/statistics/events-connection'
import type from './types'
import ConnectionStatusEnum from '../../libraries/mysterium-tequilapi/dto/connection-status-enum'
import TequilapiError from '../../libraries/mysterium-tequilapi/tequilapi-error'
import messages from '../../app/messages'
import logger from '../../app/logger'

class ConnectionManager {
  _eventSender: EventSender
  _bugReporter: BugReporter
  _tequilapi: TequilapiClient

  constructor (eventSender: EventSender, bugReporter: BugReporter, tequilapi: TequilapiClient) {
    this._eventSender = eventSender
    this._bugReporter = bugReporter
    this._tequilapi = tequilapi
  }

  async connect (
    connectionRequest: ConnectionRequestDTO,
    commit: CommitFunction,
    dispatch: DispatchFunction,
    state: ConnectionStore) {
    const eventTracker = new ConnectEventTracker(this._eventSender, currentUserTime)
    let originalCountry = ''
    if (state.location != null && state.location.originalCountry != null) {
      originalCountry = state.location.originalCountry
    }
    eventTracker.connectStarted(
      {
        consumerId: connectionRequest.consumerId,
        providerId: connectionRequest.providerId
      },
      originalCountry
    )
    const looper = state.actionLoopers[type.FETCH_CONNECTION_STATUS]
    if (looper) {
      await looper.stop()
    }
    await dispatch(type.SET_CONNECTION_STATUS, ConnectionStatusEnum.CONNECTING)
    commit(type.CONNECTION_STATISTICS_RESET)
    commit(type.SET_LAST_CONNECTION_PROVIDER, connectionRequest.providerId)
    try {
      await this._tequilapi.connectionCreate(connectionRequest)
      eventTracker.connectEnded()
      commit(type.HIDE_ERROR)
    } catch (err) {
      if (err instanceof TequilapiError && err.isRequestClosedError) {
        eventTracker.connectCanceled()
        return
      }

      commit(type.SHOW_ERROR_MESSAGE, messages.connectFailed)

      eventTracker.connectEnded('Error: Connection to node failed.')

      if (!(err instanceof TequilapiError)) {
        this._bugReporter.captureInfoException(err)
      }
    } finally {
      if (looper) {
        looper.start()
      }
    }
  }

  async disconnect (commit: CommitFunction, dispatch: DispatchFunction, state: ConnectionStore) {
    const looper = state.actionLoopers[type.FETCH_CONNECTION_STATUS]
    if (looper) {
      await looper.stop()
    }

    try {
      await dispatch(type.SET_CONNECTION_STATUS, ConnectionStatusEnum.DISCONNECTING)

      try {
        await this._tequilapi.connectionCancel()
      } catch (err) {
        commit(type.SHOW_ERROR, err)
        logger.info('Connection cancelling failed:', err)
        if (!(err instanceof TequilapiError)) {
          this._bugReporter.captureInfoException(err)
        }
      }
      dispatch(type.FETCH_CONNECTION_STATUS)
      dispatch(type.CONNECTION_IP)
    } catch (err) {
      commit(type.SHOW_ERROR, err)
      throw (err)
    } finally {
      if (looper) {
        looper.start()
      }
    }
  }
}

type CommitFunction = (string, any) => void
type DispatchFunction = (string, ...Array<any>) => Promise<void>

export default ConnectionManager
