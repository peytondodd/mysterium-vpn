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
  <div>
    <div
      class="identity-registration"
      :class="{'identity-registered': registered, 'identity-unregistered': !registered}"
      @click="showInfoWindow()"
      v-if="registration && !showInfo">
      <div class="identity-text">ID</div>
      <div
        class="identity-tooltip">{{ registered ? 'View Your Identity' : 'Please activate your ID' }}</div>
    </div>

    <div
      class="app__nav nav"
      id="registration-instructions"
      :class="{'is-open': showInfo}">
      <div
        class="nav__content"
        :class="{'is-open': showInfo}">

        <div class="registration-instructions-top-row">
          <div
            class="nav__burger burger"
            @click="showInfo = false">
            <i class="burger__bar burger__bar--1"/>
            <i class="burger__bar burger__bar--2"/>
            <i class="burger__bar burger__bar--3"/>
          </div>
        </div>

        <hr>

        <h1>Mysterium ID</h1>

        <div
          class="consumer-identity-id-container"
          :class="{registered: registered}">
          <div class="consumer-identity-id-item">
            <logo-icon :active="registered" />
          </div>
          <div class="consumer-identity-id-item">
            <span class="consumer-identity-id">{{ consumerId }}</span>
          </div>
          <div>
            <span
              class="consumer-identity-id-item consumer-identity-id-copy"
              @click="copyId()">
              <icon-copy class="nav__icon nav__icon--eye"/>
              <span class="identity-tooltip">Copy to Clipboard</span>
            </span>
          </div>
        </div>

        <div
          class="consumer-identity-registration"
          v-if="!registered">
          <p>
            In order to use Mysterium VPN you need to have registered ID in Mysterium Blockchain
            by staking your MYST tokens on it (i.e. paying for it).
          </p>
          <p>
            To pay for the ID we suggest to use MetaMask wallet. Please follow below instructions to proceed further:
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
            v-if="registration"
            @click="openPaymentsUrl()">
            Register Your ID
          </div>
        </div>
      </div>
      <transition name="fade">
        <div
          v-if="showInfo"
          class="nav__backdrop"
          @click="showInfo = false"/>
      </transition>
    </div>

  </div>
</template>

<script>

import { shell, clipboard } from 'electron'
import { mapGetters } from 'vuex'
import IconCopy from '@/assets/img/icon--copy.svg'
import LogoIcon from './logo-icon'

export default {
  name: 'IdentityRegistration',
  dependencies: ['rendererCommunication', 'getPaymentLink'],
  components: {
    IconCopy,
    LogoIcon
  },
  data () {
    return {
      registration: null,
      showInfo: false
    }
  },
  methods: {
    showInfoWindow () {
      this.showInfo = true
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
    registered () {
      if (!this.registration) {
        return null
      }
      return this.registration.registered
    },
    ...mapGetters({
      consumerId: 'currentIdentity'
    })
  },
  mounted () {
    this.rendererCommunication.onRegistrationUpdate(registration => {
      this.registration = registration
    })
  }
}
</script>
