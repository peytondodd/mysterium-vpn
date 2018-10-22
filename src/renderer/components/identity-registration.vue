<!--
  - Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
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
  <div id="identity-registration">
    <div
      class="app__nav nav"
      id="registration-instructions"
      :class="{'is-open': isIdentityMenuOpen}">
      <div
        class="nav__content"
        :class="{'is-open': isIdentityMenuOpen}">

        <div class="nav__navicon">
          <close-button :click="hideInstructions"/>
        </div>

        <ul class="nav__list identity-registration-content">
          <li>
            <h1>Mysterium ID</h1>
          </li>
          <li>
            <div
              v-if="consumerId"
              class="consumer-id-view">
              <div class="consumer-id-view__item">
                <logo-icon :active="registrationFetched" />
              </div>
              <div class="consumer-id-view__item">
                <span
                  class="consumer-id-view__id-text"
                  :class="{'consumer-id-view__id-text--registered': registrationFetched}">
                  {{ consumerId }}
                </span>
              </div>
              <div class="consumer-id-view__item">
                <copy-button :text="consumerId" />
              </div>
            </div>
          </li>
          <li>
            <div v-if="!registrationFetched">
              <p>
                In order to use Mysterium VPN you need to have registered ID in Mysterium Blockchain
                by staking your MYST tokens on it (i.e. paying for it).
              </p>
              <p>
                To pay for the ID we suggest to use MetaMask wallet.
                Please follow below instructions to proceed further:
              </p>
              <ul>
                <li>1. Click on the “Register Your ID” button</li>
                <li>2. Claim MYST and ETH test tokens</li>
                <li>3. Allow Mysterium SmartContract to reserve MYST tokens</li>
                <li>4. Register your ID by clicking on “Pay & Register For ID”</li>
                <li>5. Wait for few minutes until the payment is processed</li>
              </ul>
              <div
                class="btn"
                @click="openPaymentsUrl()">
                Register Your ID
              </div>
            </div>
          </li>
        </ul>
      </div>
      <transition name="fade">
        <div
          v-if="isIdentityMenuOpen"
          class="nav__backdrop"
          @click="hideInstructions"/>
      </transition>
    </div>
  </div>
</template>

<script>

import CloseButton from './close-button'
import CopyButton from './copy-button'
import types from '../store/types'
import { shell, clipboard } from 'electron'
import { mapGetters } from 'vuex'
import LogoIcon from './logo-icon'

export default {
  name: 'IdentityRegistration',
  dependencies: ['rendererCommunication', 'getPaymentLink'],
  components: {
    CloseButton,
    CopyButton,
    LogoIcon
  },
  methods: {
    hideInstructions () {
      this.$store.commit(types.HIDE_IDENTITY_MENU)
    },
    openPaymentsUrl () {
      const url = this.getPaymentLink(this.registration)
      shell.openExternal(url)
    },
    copyId () {
      clipboard.writeText(this.consumerId)
    }
  },
  computed: {
    registrationFetched () {
      return this.$store.getters.registration != null
    },
    isIdentityMenuOpen () {
      return this.$store.state.main.identityMenuOpen
    },
    ...mapGetters({
      consumerId: 'currentIdentity'
    })
  }
}
</script>
