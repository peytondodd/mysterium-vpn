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
  <div
    class="identity-button"
    :class="{'identity-button--registered': registered, 'identity-button--unregistered': !registered}"
    @click="click">
    <div class="identity-button__text">ID</div>
    <div
      class="identity-button__tooltip">{{ registered ? 'View your identity' : 'Please activate your ID' }}</div>
  </div>
</template>

<script>

import CloseButton from './close-button'

export default {
  name: 'IdentityButton',
  props: {
    registered: {
      type: Boolean,
      default: false
    },
    click: {
      type: Function,
      required: true
    }
  },
  components: { CloseButton }
}
</script>
