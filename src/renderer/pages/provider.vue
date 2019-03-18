<!--
  - Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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
  <div class="page">
    <Identity v-if="paymentsAreEnabled"/>

    <div class="page__control control">

      <tabs/>

      <div class="control__top">
        <h1>{{ statusText }}</h1>
      </div>

      <div class="control__bottom">
        <div
          class="control__action btn"
          :class="{'btn--transparent':true, 'btn--disabled': pendingRequest}"
          @click="toggleService">
          {{ buttonText }}
        </div>
      </div>

      <div class="control__footer">
        <div class="footer__stats stats">
          <transition name="slide-up">
            <div
              class="stats__error error"
              v-if="showError">
              <div class="error__text">
                <div>{{ errorMessage }}</div>
              </div>
              <i
                class="error__close close close--s close--white"
                @click="hideErr()"/>
            </div>
          </transition>
          <div class="stats__block">
            <div class="stats__label">CONNECTED</div>
            <div class="stats__value">{{ users }}</div>
            <div class="stats__unit">USERS</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import type from '../store/types'
import { mapMutations, mapGetters } from 'vuex'
import AppError from '../partials/app-error'
import Tabs from '../components/tabs'
import { ServiceStatus } from 'mysterium-vpn-js/lib/models/service-status'
import { ConnectionStatus } from 'mysterium-tequilapi/lib/dto/connection-status'
import logger from '../../app/logger'
import Identity from '../components/identity'

export default {
  name: 'Main',
  components: {
    Tabs,
    Identity,
    AppError
  },
  dependencies: [
    'tequilapiClient',
    'featureToggle',
    'bugReporter',
    'providerService'
  ],
  data () {
    return {
      status: ServiceStatus.NOT_RUNNING,
      pendingRequest: false,
      users: 0
    }
  },
  async mounted () {
    this.statusSubscriber = newStatus => this.onStatusChange(newStatus)
    this.providerService.addStatusSubscriber(this.statusSubscriber)
    this.providerService.checkForExistingService().catch(err => {
      logger.error('Check for existing service failed', err)
    })

    // reset any error messages from VPN page
    this.$store.commit(type.HIDE_ERROR)

    // disconnect from VPN if still connected
    if (this.$store.getters.status !== ConnectionStatus.NOT_CONNECTED) {
      this.$store.dispatch(type.DISCONNECT)
    }

    // stop statistics fetching
    this.$store.dispatch(type.STOP_ACTION_LOOPING, type.CONNECTION_IP)
    this.$store.dispatch(type.STOP_ACTION_LOOPING, type.FETCH_CONNECTION_STATUS)
  },
  beforeDestroy () {
    this.providerService.removeStatusSubscriber(this.statusSubscriber)
    clearInterval(this.clearInterval)
  },
  computed: {
    ...mapGetters(['errorMessage', 'showError', 'currentIdentity']),
    statusText () {
      const notRunning = 'Stopped'
      const starting = 'Starting..'
      const running = 'Running'

      switch (this.status) {
        case ServiceStatus.NOT_RUNNING:
          return notRunning
        case ServiceStatus.STARTING:
          return starting
        case ServiceStatus.RUNNING:
          return running
        default:
          const msg = `Unknown status value: ${this.status}`
          logger.error(msg)
          this.bugReporter.captureErrorMessage(msg)
          return notRunning
      }
    },
    buttonText () {
      if (this.pendingRequest) {
        return 'Please wait...'
      }

      const notRunning = 'Start service'
      const starting = 'Starting..'
      const running = 'Stop service'

      switch (this.status) {
        case ServiceStatus.NOT_RUNNING:
          return notRunning
        case ServiceStatus.STARTING:
          return starting
        case ServiceStatus.RUNNING:
          return running
        default:
          const msg = `Unknown status value: ${this.status}`
          logger.error(msg)
          this.bugReporter.captureErrorMessage(msg)
          return notRunning
      }
    },
    paymentsAreEnabled () {
      return this.featureToggle.paymentsAreEnabled()
    }
  },
  methods: {
    ...mapMutations({ hideErr: type.HIDE_ERROR }),
    async toggleService () {
      if (this.pendingRequest) {
        return
      }

      if (this.status === ServiceStatus.NOT_RUNNING) {
        await this.startService()

        return
      }

      if (this.status === ServiceStatus.RUNNING) {
        await this.stopService()
      }

      this.providerService.checkForExistingService()
    },

    async startService () {
      this.pendingRequest = true

      try {
        // TODO: before starting service, ensure that VPN service has finished stopping
        await this.providerService.start(this.currentIdentity)

        this.$store.commit(type.HIDE_ERROR)
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to start the service: ' + e.message)
        // TODO: hide this error message if starting service succeeds after another try
        logger.warn(e)
      }

      this.pendingRequest = false
    },

    async stopService () {
      this.pendingRequest = true

      try {
        await this.providerService.stop()

        this.status = ServiceStatus.NOT_RUNNING
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to stop the service: ' + e.message)
        logger.warn(e)
      }

      this.pendingRequest = false
    },

    onStatusChange (newStatus) {
      this.status = newStatus
      // TODO: show error if status changes from "Starting" to "NotRunning"
      // TODO: show error if service ends unexpectedly, without stoping service
    }
  }
}
</script>
