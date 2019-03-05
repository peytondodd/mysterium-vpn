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
    <identity-button
      v-if="paymentsAreEnabled && !isIdentityMenuOpen"
      :registered="registered"
      :click="showInstructions"/>

    <IdentityRegistration v-if="paymentsAreEnabled"/>

    <div class="page__control control">

      <tabs/>

      <div class="control__top">
        <h1>{{ statusText }}</h1>
      </div>

      <div class="control__bottom">
        <div
          class="control__action btn"
          :class="{'btn--transparent':true}"
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
import { ServiceStatus } from 'mysterium-tequilapi/lib/dto/service-status'
import { ConnectionStatus } from 'mysterium-tequilapi/lib/dto/connection-status'
import logger from '../../app/logger'
import IdentityButton from '../components/identity-button'
import IdentityRegistration from '../components/identity-registration'

export default {
  name: 'Main',
  components: {
    Tabs,
    IdentityButton,
    IdentityRegistration,
    AppError
  },
  dependencies: [
    'providerService',
    'featureToggle'
  ],
  data () {
    return {
      status: ServiceStatus.NOT_RUNNING,
      serviceId: '',
      users: 0
    }
  },
  computed: {
    ...mapGetters(['errorMessage', 'showError', 'currentIdentity']),
    statusText () {
      switch (this.status) {
        case ServiceStatus.STARTING:
          return 'Starting..'
        case ServiceStatus.RUNNING:
          return 'Running'
        default:
          return 'Stopped'
      }
    },
    buttonText () {
      switch (this.status) {
        case ServiceStatus.STARTING:
          return 'Starting..'
        case ServiceStatus.RUNNING:
          return 'Stop service'
        default:
          return 'Start service'
      }
    },
    paymentsAreEnabled () {
      return this.featureToggle.paymentsAreEnabled()
    },
    isIdentityMenuOpen () {
      return this.$store.state.main.identityMenuOpen
    },
    registration () {
      return this.$store.getters.registration
    },
    registered () {
      if (!this.registration) {
        return false
      }
      return this.registration.registered
    },
  },
  methods: {
    ...mapMutations({ hideErr: type.HIDE_ERROR }),
    async toggleService () {
      if (this.status === ServiceStatus.NOT_RUNNING) {
        await this.startService()

        return
      }

      if (this.status === ServiceStatus.RUNNING) {
        await this.stopService()
      }
    },

    async startService () {
      try {
        const service = await this.providerService.start(this.currentIdentity, 'openvpn')
        this.status = service.status
        this.serviceId = service.id

        this.startIncrementingUsers()
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to start the service')
        logger.log(e)
      }
    },

    async stopService () {
      try {
        await this.providerService.stop(this.serviceId)
        this.status = ServiceStatus.NOT_RUNNING

        this.stopIncrementingUsers()
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to stop the service')
        logger.log(e)
      }
    },

    startIncrementingUsers () {
      // UI candy
      this.interval = setInterval(() => {
        this.incrementUsers()
      }, 3000)
    },

    stopIncrementingUsers () {
      clearInterval(this.interval)
      this.users = 0
    },

    incrementUsers () {
      const random = Math.floor(Math.random() * 10) + 1

      if (random > 6 && this.users > 0) {
        this.users--

        return
      }

      if (this.status === ServiceStatus.RUNNING) {
        this.users++

        return
      }

      this.users = 0
    },
    showInstructions () {
      this.$store.commit(type.SHOW_IDENTITY_MENU)
    }
  },
  async mounted () {
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
    clearInterval(this.clearInterval)
  }
}
</script>
