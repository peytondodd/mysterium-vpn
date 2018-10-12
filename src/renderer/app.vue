<!--
  - Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License
  - along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<template>
  <div
    id="app"
    class="app">
    <div id="content">
      <IdentityRegistration v-if="paymentsAreEnabled"/>

      <app-modal
        v-if="overlayError"
        :close="false">
        <app-error :error="overlayError"/>
      </app-modal>

      <app-nav
        class="app__nav"
        v-if="navVisible"/>

      <router-view class="app__page"/>

      <transition
        name="fade"
        v-if="visual">
        <app-visual class="app__visual"/>
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import type from '@/store/types'
import IdentityRegistration from './components/identity-registration'
import AppVisual from '@/partials/app-visual'
import AppNav from '@/partials/app-nav'
import AppError from '@/partials/app-error'
import AppModal from '@/partials/app-modal'
import logger from '../app/logger'
import messages from '../app/messages'

export default {
  name: 'App',
  components: {
    AppVisual,
    AppNav,
    AppError,
    AppModal,
    IdentityRegistration
  },
  dependencies: ['rendererCommunication', 'syncCommunication', 'logger', 'bugReporterMetrics', 'featureToggle'],
  computed: {
    ...mapGetters(['navVisible', 'loading', 'visual', 'overlayError']),
    paymentsAreEnabled () {
      return this.featureToggle.paymentsAreEnabled()
    }
  },
  async mounted () {
    logger.setLogger(this.logger)
    logger.info('App view was mounted')

    // we need to notify the main process that we're up
    this.rendererCommunication.rendererBooted.send()

    this.rendererCommunication.reconnectRequest.on(() => {
      this.$store.dispatch(type.RECONNECT)
    })

    this.rendererCommunication.connectionRequest.on((proposal) => {
      const provider = {
        id: proposal.providerId,
        country: proposal.providerCountry
      }
      this.$store.dispatch(type.CONNECT, provider)
    })

    this.rendererCommunication.connectionCancel.on(() => {
      this.$store.dispatch(type.DISCONNECT)
    })

    this.rendererCommunication.termsRequested.on((terms) => {
      this.$store.commit(type.TERMS, terms)
      this.$router.push('/terms')
    })

    this.rendererCommunication.termsAccepted.on(() => {
      this.$router.push('/')
    })

    this.rendererCommunication.rendererShowError.on((error) => {
      logger.info('App error received from communication:', error.hint, error.message)
      this.$store.dispatch(type.OVERLAY_ERROR, error)
    })

    // if the client was down, but now up, we need to unlock the identity once again
    this.rendererCommunication.healthcheckUp.on(() => {
      this.$store.dispatch(type.OVERLAY_ERROR, null)
      this.$router.push('/load')
    })

    this.rendererCommunication.healthcheckDown.on(() => {
      this.$store.dispatch(type.OVERLAY_ERROR, messages.mysteriumCLientDown)
    })

    this.rendererCommunication.identityRegistration.on(registration => {
      this.$store.commit(type.SET_IDENTITY_REGISTRATION, registration)
    })
  }
}
</script>

<style src="@/assets/less/index.less" lang="less"></style>
