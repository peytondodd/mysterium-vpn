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

import IdentityRegistrationDTO from '../libraries/mysterium-tequilapi/dto/identity-registration'
import type { CurrentIdentityChangeDTO } from './communication/dto'
import TequilapiRegistrationFetcher from './data-fetchers/tequilapi-registration-fetcher'
import IdentityDTO from '../libraries/mysterium-tequilapi/dto/identity'
import MainMessageBusCommunication from './communication/main-message-bus-communication'
import FeatureToggle from './features/feature-toggle'
import ConnectionStatusEnum from '../libraries/mysterium-tequilapi/dto/connection-status-enum'
import type { BugReporter } from './bug-reporting/interface'
import StartupEventTracker from './statistics/startup-event-tracker'
import logger from './logger'
import { UserSettingsStore } from './user-settings/user-settings-store'
import Notification from './notification'

function showNotificationOnDisconnect (
  userSettingsStore: UserSettingsStore,
  communication: MainMessageBusCommunication,
  disconnectNotification: Notification) {
  communication.onConnectionStatusChange((status) => {
    const shouldShowNotification =
      userSettingsStore.getAll().showDisconnectNotifications &&
      (status.newStatus === ConnectionStatusEnum.NOT_CONNECTED &&
        status.oldStatus === ConnectionStatusEnum.CONNECTED)

    if (shouldShowNotification) {
      disconnectNotification.show()
    }
  })
}

function syncFavorites (userSettingsStore: UserSettingsStore, communication: MainMessageBusCommunication) {
  communication.onToggleFavoriteProvider((fav) => {
    userSettingsStore.setFavorite(fav.id, fav.isFavorite)
    userSettingsStore.save()
  })
}

function syncShowDisconnectNotifications (
  userSettingsStore: UserSettingsStore,
  communication: MainMessageBusCommunication) {
  communication.onUserSettingsRequest(() => {
    communication.sendUserSettings(userSettingsStore.getAll())
  })

  communication.onUserSettingsShowDisconnectNotifications((show) => {
    userSettingsStore.setShowDisconnectNotifications(show)
    userSettingsStore.save()
  })
}

function setCurrentIdentityForEventTracker (
  startupEventTracker: StartupEventTracker,
  communication: MainMessageBusCommunication) {
  communication.onCurrentIdentityChangeOnce((identityChange: CurrentIdentityChangeDTO) => {
    startupEventTracker.sendRuntimeEnvironmentDetails(identityChange.id)
  })
}

function startRegistrationFetcherOnCurrentIdentity (
  featureToggle: FeatureToggle,
  registrationFetcher: TequilapiRegistrationFetcher,
  communication: MainMessageBusCommunication) {
  communication.onCurrentIdentityChangeOnce((identityChange: CurrentIdentityChangeDTO) => {
    const identity = new IdentityDTO({ id: identityChange.id })
    if (featureToggle.paymentsAreEnabled()) {
      registrationFetcher.start(identity.id)
      logger.info(`[ComBinds]Registration fetcher started with ID ${identity.id}`)
    }
  })
}

function syncCurrentIdentityForBugReporter (
  bugReporter: BugReporter,
  communication: MainMessageBusCommunication) {
  communication.onCurrentIdentityChange((identityChange: CurrentIdentityChangeDTO) => {
    const identity = new IdentityDTO({ id: identityChange.id })
    bugReporter.setUser(identity)
  })
}

function syncRegistrationStatus (
  registrationFetcher: TequilapiRegistrationFetcher,
  bugReporter: BugReporter,
  communication: MainMessageBusCommunication) {
  registrationFetcher.onFetchedRegistration((registration: IdentityRegistrationDTO) => {
    communication.sendRegistration(registration)
  })
  registrationFetcher.onFetchingError((error: Error) => {
    logger.error('[ComBinds]Identity registration fetching failed', error)
    bugReporter.captureErrorException(error)
  })
}

export default {
  showNotificationOnDisconnect,
  syncFavorites,
  syncShowDisconnectNotifications,
  setCurrentIdentityForEventTracker,
  startRegistrationFetcherOnCurrentIdentity,
  syncCurrentIdentityForBugReporter,
  syncRegistrationStatus
}
