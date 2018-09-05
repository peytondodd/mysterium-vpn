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
import DIContainer from '../../app/di/jpex-container'
import mysteriumVpnBootstrap from './modules/application'
import bugReportingConfigBootstrap from '../../dependencies/bug-reporting'
import featureToggleBootstrap from '../../dependencies/feature-toggle'
import bugReportingBootstrap from './modules/bug-reporting'
import eventsBootstrap from '../../dependencies/statistics'
import paymentsBootstrap from '../../dependencies/payments'
import mysteriumClientBootstrap from './modules/mysterium-client'
import mysteriumTequilapiBootstrap from '../../dependencies/mysterium-tequilapi'
import proposalFetcherBootstrap from './modules/proposal-fetcher'
import registrationFetcherBootstrap from './modules/registration-fetcher'
import userSettingsBootstrap from './modules/user-settings'
import disconnectNotificationsBootstrap from './modules/disconnect-notification'
import communicationBootstrap from './modules/communication'

/**
 * Bootstraps all application dependencies into DI container
 */
function bootstrap (): DIContainer {
  const container = new DIContainer()

  featureToggleBootstrap(container)
  mysteriumVpnBootstrap(container)
  bugReportingConfigBootstrap(container)
  bugReportingBootstrap(container)
  eventsBootstrap(container)
  paymentsBootstrap(container)
  mysteriumClientBootstrap(container)
  mysteriumTequilapiBootstrap(container)
  proposalFetcherBootstrap(container)
  registrationFetcherBootstrap(container)
  userSettingsBootstrap(container)
  disconnectNotificationsBootstrap(container)
  communicationBootstrap(container)

  return container
}

export { bootstrap }
export default bootstrap()
