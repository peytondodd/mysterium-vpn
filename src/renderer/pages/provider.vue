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
    <div class="page__control control">

      <tabs/>

      <div class="control__top">
        <h1>Active</h1>

        <div
          class="control__location">
          connected users: <strong>5</strong>
        </div>
      </div>

      <div class="control__bottom">
        <div
          class="control__action btn"
          :class="{'btn--transparent':true}"
          @click="startService">
          Stop service
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
          <div class="stats__container">
            <div class="stats__block">
              <div class="stats__label">TIME</div>
              <div class="stats__value">00:00:00</div>
              <div class="stats__unit">H:M:S</div>
            </div>
            <div class="stats__block">
              <div class="stats__label">DATA RECEIVED</div>
              <div class="stats__value">3.4</div>
              <div class="stats__unit">Gb</div>
            </div>
            <div class="stats__block">
              <div class="stats__label">DATA SENT</div>
              <div class="stats__value">12.3</div>
              <div class="stats__unit">Gb</div>
            </div>
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

export default {
  name: 'Main',
  components: {
    Tabs,
    AppError
  },
  dependencies: [
    'tequilapiClient'
  ],
  data () {
    return {}
  },
  computed: {
    ...mapGetters(['errorMessage', 'showError'])
  },
  methods: {
    ...mapMutations({ hideErr: type.HIDE_ERROR }),
    startService () {
    }
  },
  async mounted () {
  },
  beforeDestroy () {
  }
}
</script>
