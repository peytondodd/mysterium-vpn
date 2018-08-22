<!--
  - Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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
      @click="showInstructions = true">
      <div class="identity-text">ID</div>
      <div
        class="identity-tooltip"
        v-if="!registered">Please activate your ID</div>
    </div>

    <div
      class="app__nav nav is-open"
      id="registration-instructions"
      v-if="showInstructions">
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
        v-if="paymentLink"
        @click="openRemoteLink(paymentLink)">
        Copy Wallet Address
      </div>
    </div>
    <div
      v-if="showInstructions"
      class="nav__backdrop"
      style="z-index: 2"/>
  </div>
</template>

<script>

import { shell } from 'electron'

export default {
  name: 'IdentityRegistration',
  dependencies: ['rendererCommunication'],
  data () {
    return {
      registered: null,
      paymentLink: null,
      showInstructions: false
    }
  },
  methods: {
    openRemoteLink (url) {
      shell.openExternal(url)
    }
  },
  mounted () {
    this.rendererCommunication.onRegistrationUpdate(registration => {
      this.registered = registration.registered

      const { publicKey, signature } = registration
      this.paymentLink = `http://walletx.mysterium.network/` +
        `?part1=${publicKey.part1}&part2=${publicKey.part2}` +
        `&r=${signature.r}&s=${signature.s}&v=${signature.v}`
    })
  }
}
</script>
