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
  <div
    class="identity-registration"
    :class="{'identity-registered': registered, 'identity-unregistered': !registered}">
    <div class="identity-text">ID</div>
    <div
      class="identity-tooltip"
      v-if="!registered">Please activate your ID</div>
  </div>
</template>

<script>
export default {
  name: 'IdentityRegistration',
  dependencies: ['rendererCommunication'],
  data () {
    return {
      registered: null
    }
  },
  mounted () {
    this.rendererCommunication.onRegistrationUpdate(r => {
      this.registered = r
    })
  }
}
</script>
