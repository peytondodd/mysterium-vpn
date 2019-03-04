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
import AppVisual from '@/partials/app-visual'
import AppNav from '@/partials/app-nav'
import AppError from '@/partials/app-error'
import AppModal from '@/partials/app-modal'
import logger from '../app/logger'
import { RendererInitializer } from './renderer-initializer'

export default {
  name: 'App',
  components: {
    AppVisual,
    AppNav,
    AppError,
    AppModal
  },
  dependencies: ['rendererCommunication', 'syncCommunication', 'logger', 'identityManager', 'bugReporter'],
  computed: {
    ...mapGetters(['navVisible', 'loading', 'visual', 'overlayError'])
  },
  async mounted () {
    logger.setLogger(this.logger)
    logger.info('Renderer was mounted, will initialize')

    new RendererInitializer().initialize(this.rendererCommunication, this.bugReporter, this.identityManager,
      this.$store, this.$router)

    logger.info('Renderer initialized')
  }
  // TODO: unsubscribe on beforeDestroy
}
</script>

<style src="@/assets/less/index.less" lang="less"></style>
