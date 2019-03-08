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
  <div>
    <identity-button
      v-if="!isIdentityMenuOpen"
      :registered="registered"
      :click="showInstructions"/>

    <IdentityRegistration/>
  </div>
</template>

<script>
import IdentityButton from '../components/identity-button'
import IdentityRegistration from '../components/identity-registration'
import types from '../store/types'

export default {
  components: {
    IdentityButton,
    IdentityRegistration
  },
  dependencies: [
  ],
  methods: {
    showInstructions () {
      this.$store.commit(types.SHOW_IDENTITY_MENU)
    }
  },
  computed: {
    isIdentityMenuOpen () {
      return this.$store.state.main.identityMenuOpen
    },
    registered () {
      if (!this.registration) {
        return false
      }
      return this.registration.registered
    },
    registration () {
      return this.$store.getters.registration
    }
  }
}
</script>
