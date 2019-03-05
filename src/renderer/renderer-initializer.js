/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import type from '@/store/types'
import messages from '../app/messages'
import type { RendererCommunication } from '../app/communication/renderer-communication'
import type { BugReporter } from '../app/bug-reporting/interface'
import IdentityManager from '../app/identity-manager'
import logger from '../app/logger'
import TequilapiRegistrationFetcher from '../app/data-fetchers/tequilapi-registration-fetcher'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'

export class RendererInitializer {
  initialize (rendererCommunication: RendererCommunication, bugReporter: BugReporter, identityManager: IdentityManager,
    registrationFetcher: TequilapiRegistrationFetcher, store: any, router: any) {
    // we need to notify the main process that we're up
    rendererCommunication.rendererBooted.send()

    store.dispatch('startObserving', identityManager)
    identityManager.onErrorMessage(message => {
      store.commit(type.SHOW_ERROR_MESSAGE, message)
    })
    identityManager.onCurrentIdentityChange(identity => {
      rendererCommunication.currentIdentityChanged.send({ id: identity.id })
      bugReporter.setUser(identity)
    })

    rendererCommunication.reconnectRequest.on(() => {
      store.dispatch(type.RECONNECT)
    })

    rendererCommunication.connectionRequest.on((proposal) => {
      const provider = {
        id: proposal.providerId,
        country: proposal.providerCountry
      }
      store.dispatch(type.CONNECT, provider)
    })

    rendererCommunication.connectionCancel.on(() => {
      store.dispatch(type.DISCONNECT)
    })

    rendererCommunication.termsRequested.on((terms) => {
      store.commit(type.TERMS, terms)
      router.push('/terms')
    })

    rendererCommunication.termsAccepted.on(() => {
      router.push('/')
    })

    rendererCommunication.rendererShowError.on((error) => {
      logger.info('App error received from communication:', error.hint, error.message)
      store.dispatch(type.OVERLAY_ERROR, error)
    })

    // if the client was down, but now up, we need to unlock the identity once again
    rendererCommunication.healthcheckUp.on(() => {
      store.dispatch(type.OVERLAY_ERROR, null)
      router.push('/load')
    })

    rendererCommunication.healthcheckDown.on(() => {
      store.dispatch(type.OVERLAY_ERROR, messages.mysteriumCLientDown)
    })

    this._fetchRegistrationOnCurrentIdentity(identityManager, registrationFetcher, bugReporter)
  }

  _fetchRegistrationOnCurrentIdentity (
    identityManager: IdentityManager, registrationFetcher: TequilapiRegistrationFetcher, bugReporter: BugReporter) {
    registrationFetcher.onFetchedRegistration((registration: IdentityRegistrationDTO) => {
      logger.info('Identity registration fetched', registration)
      identityManager.setRegistration(registration)
    })
    registrationFetcher.onFetchingError((error: Error) => {
      logger.error('Identity registration fetching failed', error)
      bugReporter.captureErrorException(error)
    })

    identityManager.onCurrentIdentityChange((identity) => {
      registrationFetcher.start(identity.id)
      logger.info(`Registration fetcher started with ID ${identity.id}`)
    })
  }
}
