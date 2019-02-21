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
  <div/>
</template>
<script>
import { mapState } from 'vuex'
import type from '@/store/types'
import messages from '../../app/messages'
import logger from '../../app/logger'
import DelayedRetrier from '../../app/delayed-retrier'
import config from '../config'
import TequilapiError from 'mysterium-tequilapi/lib/tequilapi-error'
import IdentityManager from '../../app/identity-manager'

export default {
  dependencies: ['bugReporter', 'vpnInitializer', 'sleeper', 'tequilapiClient'],
  async mounted () {
    const { commit, dispatch } = this.$store
    try {
      this.$store.dispatch(type.LOCATION)
      commit(type.INIT_PENDING)

      const identityState = this.$store.state.identity
      const identityManager = new IdentityManager(this.tequilapiClient, commit, identityState)
      const updateClientVersion = () => dispatch(type.CLIENT_VERSION)
      const initialize = () => this.vpnInitializer.initialize(identityManager, updateClientVersion)

      const delay = async (e) => {
        const msg = 'Initialization failed, will retry.'
        logger.info(msg, e)
        this.bugReporter.captureInfoMessage(msg)
        await this.sleeper.sleep(config.initializationSleepBetweenRetries)
      }
      const initializeRetrier = new DelayedRetrier(initialize, delay, config.initializationMaxRetries)
      await initializeRetrier.retryWithDelay()

      commit(type.INIT_SUCCESS)
      this.$router.push('/vpn')
    } catch (err) {
      err.message = `Application loading failed: ${err.message}`
      logger.error(err)
      if (!(err instanceof TequilapiError)) {
        this.bugReporter.captureErrorException(err)
      }

      commit(type.INIT_FAIL)
      commit(type.OVERLAY_ERROR, messages.initializationError)
    }
  },
  computed: {
    ...mapState({
      error: state => state.main.error
    })
  },
  name: 'LoadingScreen'
}
</script>
