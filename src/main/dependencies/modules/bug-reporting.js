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
import { app } from 'electron'
import Raven from 'raven'
import BugReporterMain from '../../../app/bug-reporting/bug-reporter-main'
import type { Container } from '../../../app/di'
import MainEnvironmentCollector from '../../../app/bug-reporting/environment/main-environment-collector'
import { createWinstonCachingLogger } from '../../../app/logging/winston'
import type { EnvironmentCollector } from '../../../app/bug-reporting/environment/environment-collector'
import LogCache from '../../../app/logging/log-cache'
import LogCacheBundle from '../../../app/logging/log-cache-bundle'
import type { BugReporterMetrics } from '../../../app/bug-reporting/metrics/bug-reporter-metrics'
import BugReporterMetricsStore from '../../../app/bug-reporting/metrics/bug-reporter-metrics-store'
import { TimeFormatter } from '../../../libraries/time-formatter'

function bootstrap (container: Container) {
  container.factory(
    'logger',
    ['backendLogCache'],
    (backendLogCache) => {
      const logPath = app.getPath('userData')
      return createWinstonCachingLogger(backendLogCache, logPath)
    }
  )

  container.constant(
    'bugReporter.sentryURL',
    'https://f1e63dd563c34c35a56e98aa02518d40:0104611dab3d492eae3c28936c34505f@sentry.io/300978'
  )

  container.factory(
    'bugReporter',
    ['bugReporter.sentryURL', 'bugReporter.config'],
    (sentryURL, config) => {
      const raven = Raven.config(sentryURL, config).install()
      return new BugReporterMain(raven)
    }
  )

  container.factory(
    'bugReporterMetrics',
    ['timeFormatter'],
    (timeFormatter: TimeFormatter): BugReporterMetrics => new BugReporterMetricsStore(timeFormatter)
  )

  container.factory(
    'backendLogCache',
    [],
    (): LogCache => new LogCache()
  )

  container.factory(
    'frontendLogCache',
    [],
    (): LogCache => new LogCache()
  )

  container.factory(
    'mysteriumProcessLogCache',
    [],
    (): LogCache => new LogCache()
  )

  container.service(
    'environmentCollector',
    ['backendLogCache', 'frontendLogCache', 'mysteriumProcessLogCache', 'mysteriumVpnReleaseID', 'bugReporterMetrics'],
    (
      backendLogCache: LogCache,
      frontendLogCache: LogCache,
      mysteriumProcessLogCache: LogCache,
      mysteriumVpnReleaseID: string,
      bugReporterMetrics: BugReporterMetrics): EnvironmentCollector => {
      const bundle = new LogCacheBundle(backendLogCache, frontendLogCache, mysteriumProcessLogCache)
      return new MainEnvironmentCollector(bundle, mysteriumVpnReleaseID, bugReporterMetrics)
    }
  )

  container.constant(
    'feedbackForm.headerRule',
    {
      urls: ['https://sentry.io/api/embed/error-page/*'],
      write: function (headers: Object): Object {
        headers['Referer'] = '*'
        return headers
      }
    }
  )
}

export default bootstrap
