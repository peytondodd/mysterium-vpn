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

import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { CurrentIdentityChangeDTO } from './communication/dto'
import TequilapiRegistrationFetcher from './data-fetchers/tequilapi-registration-fetcher'
import IdentityDTO from 'mysterium-tequilapi/lib/dto/identity'
import ConnectionStatusEnum from 'mysterium-tequilapi/lib/dto/connection-status-enum'
import type { BugReporter } from './bug-reporting/interface'
import StartupEventTracker from './statistics/startup-event-tracker'
import logger from './logger'
import Notification from './notification'
import type { UserSettingsStore } from './user-settings/user-settings-store'
import type { MainCommunication } from './communication/main-communication'
import { onceOnMessage } from './communication/utils'

const LOG_PREFIX = '[CommunicationBindings] '

class CommunicationBindings {
  _communication: MainCommunication

  constructor (communication: MainCommunication) {
    this._communication = communication
  }

  showNotificationOnDisconnect (userSettingsStore: UserSettingsStore, disconnectNotification: Notification) {
    this._communication.connectionStatusChanged.on((status) => {
      const shouldShowNotification =
        userSettingsStore.getAll().showDisconnectNotifications &&
        (status.newStatus === ConnectionStatusEnum.NOT_CONNECTED &&
          status.oldStatus === ConnectionStatusEnum.CONNECTED)

      if (shouldShowNotification) {
        disconnectNotification.show()
      }
    })
  }

  syncFavorites (userSettingsStore: UserSettingsStore) {
    this._communication.toggleFavoriteProvider.on(fav => {
      userSettingsStore.setFavorite(fav.id, fav.isFavorite)
    })
  }

  syncShowDisconnectNotifications (userSettingsStore: UserSettingsStore) {
    this._communication.userSettingsRequest.on(() => {
      this._communication.userSettingsSender.send(userSettingsStore.getAll())
    })

    this._communication.showDisconnectNotification.on((show) => {
      userSettingsStore.setShowDisconnectNotifications(show)
    })
  }

  setCurrentIdentityForEventTracker (startupEventTracker: StartupEventTracker) {
    onceOnMessage(this._communication.currentIdentityChanged, (identityChange: CurrentIdentityChangeDTO) => {
      startupEventTracker.sendRuntimeEnvironmentDetails(identityChange.id)
    })
  }

  startRegistrationFetcherOnCurrentIdentity (registrationFetcher: TequilapiRegistrationFetcher) {
    onceOnMessage(this._communication.currentIdentityChanged, (identityChange: CurrentIdentityChangeDTO) => {
      const identity = new IdentityDTO({ id: identityChange.id })
      registrationFetcher.start(identity.id)
      logger.info(`${LOG_PREFIX}Registration fetcher started with ID ${identity.id}`)
    })
  }

  syncCurrentIdentityForBugReporter (bugReporter: BugReporter) {
    this._communication.currentIdentityChanged.on((identityChange: CurrentIdentityChangeDTO) => {
      const identity = new IdentityDTO({ id: identityChange.id })
      bugReporter.setUser(identity)
    })
  }

  syncRegistrationStatus (registrationFetcher: TequilapiRegistrationFetcher, bugReporter: BugReporter) {
    registrationFetcher.onFetchedRegistration((registration: IdentityRegistrationDTO) => {
      this._communication.identityRegistration.send(registration)
    })
    registrationFetcher.onFetchingError((error: Error) => {
      logger.error(`${LOG_PREFIX}Identity registration fetching failed`, error)
      bugReporter.captureErrorException(error)
    })
  }
}

export default CommunicationBindings
