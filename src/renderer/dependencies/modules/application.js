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
import { Container } from '../../../app/di'
import RendererIpc from '../../../app/communication/ipc/renderer-ipc'
import { remote } from 'electron'
import VpnInitializer from '../../../app/vpn-initializer'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import realSleep from '../../../libraries/sleep'
import IpcMessageBus from '../../../app/communication/ipc-message-bus'
import { buildRendererCommunication } from '../../../app/communication/renderer-communication'
import CountryImageResolver from '../../../app/countries/unknown-country-reporter'
import ProviderService from '../../../app/provider/provider-service'

function bootstrap (container: Container) {
  const mysteriumVpnReleaseID = remote.getGlobal('__mysteriumVpnReleaseID')
  container.constant('mysteriumVpnReleaseID', mysteriumVpnReleaseID)

  container.service(
    'messageBus',
    [],
    () => {
      const ipc = new RendererIpc()
      return new IpcMessageBus(ipc)
    }
  )

  container.service(
    'rendererCommunication',
    ['messageBus'],
    (messageBus) => buildRendererCommunication(messageBus)
  )

  container.service(
    'vpnInitializer',
    ['tequilapiClient'],
    (tequilapiClient: TequilapiClient) => new VpnInitializer(tequilapiClient)
  )

  container.service(
    'sleeper',
    [],
    () => {
      return {
        async sleep (time: number): Promise<void> {
          return realSleep(time)
        }
      }
    }
  )

  container.service(
    'countryImageResolver',
    ['bugReporter'],
    (bugReporter) => new CountryImageResolver(bugReporter)
  )

  container.service(
    'providerService',
    ['tequilapiClient'],
    (tequilapiClient: TequilapiClient) => new ProviderService(tequilapiClient)
  )
}

export default bootstrap
