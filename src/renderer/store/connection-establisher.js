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
import type { ConnectionStatus } from '../../libraries/mysterium-tequilapi/dto/connection-status-enum'

interface ConnectionActions {
  resetStatistics (): void,
  setLastConnectionProvider (providerId: string): void,
  hideError (): void,
  showError (error: Error): void,
  showErrorMessage (message: string): void,
  setConnectionStatus (status: ConnectionStatus): Promise<void>,
  fetchConnectionStatus (): Promise<void>,
  fetchConnectionIp (): Promise<void>
}

interface ConnectionEstablisher {
  connect (request: ConnectionRequestDTO, actions: ConnectionActions, state: ConnectionStore): Promise<void>,
  disconnect (actions: ConnectionActions, state: ConnectionStore): Promise<void>
}

/**
 * Allows connecting and disconnecting to provider.
 */
class TequilapiConnectionEstablisher implements ConnectionEstablisher {
  _tequilapi: TequilapiClient
  _eventSender: EventSender
  _bugReporter: BugReporter

  constructor (tequilapi: TequilapiClient, eventSender: EventSender, bugReporter: BugReporter) {
    this._tequilapi = tequilapi
    this._eventSender = eventSender
    this._bugReporter = bugReporter
  }

  async connect (request: ConnectionRequestDTO, actions: ConnectionActions, state: ConnectionStore) {
    const eventTracker = new ConnectEventTracker(this._eventSender, currentUserTime)
    let originalCountry = ''
    if (state.location != null && state.location.originalCountry != null) {
      originalCountry = state.location.originalCountry
    }
    eventTracker.connectStarted(
      {
        consumerId: request.consumerId,
        providerId: request.providerId
      },
      originalCountry
    )
    const looper = state.actionLoopers[type.FETCH_CONNECTION_STATUS]
    if (looper) {
      await looper.stop()
    }
    await actions.setConnectionStatus(ConnectionStatusEnum.CONNECTING)
    actions.resetStatistics()
    actions.setLastConnectionProvider(request.providerId)
    try {
      await this._tequilapi.connectionCreate(request)
      eventTracker.connectEnded()
      actions.hideError()
    } catch (err) {
      if (err instanceof TequilapiError && err.isRequestClosedError) {
        eventTracker.connectCanceled()
        return
      }

      actions.showErrorMessage(messages.connectFailed)

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

  async disconnect (actions: ConnectionActions, state: ConnectionStore) {
    const looper = state.actionLoopers[type.FETCH_CONNECTION_STATUS]
    if (looper) {
      await looper.stop()
    }

    try {
      await actions.setConnectionStatus(ConnectionStatusEnum.DISCONNECTING)

      try {
        await this._tequilapi.connectionCancel()
      } catch (err) {
        actions.showError(err)
        logger.info('Connection cancelling failed:', err)
        if (!(err instanceof TequilapiError)) {
          this._bugReporter.captureInfoException(err)
        }
      }
      actions.fetchConnectionStatus()
      actions.fetchConnectionIp()
    } catch (err) {
      actions.showError(err)
      throw (err)
    } finally {
      if (looper) {
        looper.start()
      }
    }
  }
}

export type { ConnectionEstablisher, ConnectionActions }
export default TequilapiConnectionEstablisher
