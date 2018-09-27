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
      @click="openPaymentsOrShowInstructions()"
      v-if="registration && !showInstructions">
      <div class="identity-text">ID</div>
      <div
        class="identity-tooltip">{{ registered ? 'Check your balance' : 'Please activate your ID' }}</div>
    </div>

    <div
      class="app__nav nav"
      id="registration-instructions"
      :class="{'is-open': showInstructions}">
      <div
        class="nav__content"
        :class="{'is-open': showInstructions}">
        <div
          class="nav__burger burger"
          @click="showInstructions = false">
          <i class="burger__bar burger__bar--1"/>
          <i class="burger__bar burger__bar--2"/>
          <i class="burger__bar burger__bar--3"/>
        </div>

        <h2>Activate your ID</h2>
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
      <transition name="fade">
        <div
          v-if="showInstructions"
          class="nav__backdrop"
          @click="showInstructions = false"/>
      </transition>
    </div>
  </div>
</template>

<script>

import { shell } from 'electron'

export default {
  name: 'IdentityRegistration',
  dependencies: ['rendererTransport', 'getPaymentLink'],
  data () {
    return {
      registration: null,
      showInstructions: false
    }
  },
  methods: {
    openPaymentsOrShowInstructions () {
      if (this.registered) {
        this.openPaymentsUrl()
      } else {
        this.showInstructions = true
      }
    },
    openPaymentsUrl () {
      const url = this.getPaymentLink(this.registration)
      shell.openExternal(url)
    }
  },
  computed: {
    registered () {
      if (!this.registration) {
        return null
      }
      return this.registration.registered
    }
  },
  mounted () {
    this.rendererTransport.identityRegistrationReceiver.on(registration => {
      this.registration = registration
    })
  }
}
</script>
