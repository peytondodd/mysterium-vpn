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
  <span>
    <icon-logo-active
      v-if="registered"
      class="icon-logo"/>
    <icon-logo-inactive
      v-else
      class="icon-logo"/>
  </span>
</template>

<script>
import IconLogoActive from '@/assets/img/icon--logo-active.svg'
import IconLogoInactive from '@/assets/img/icon--logo-inactive.svg'

export default {
  name: 'LogoIcon',
  props: {
    registered: {
      type: Boolean,
      default: false
    }
  },
  components: {
    IconLogoActive,
    IconLogoInactive
  }
}
</script>

<style scoped>
  .icon-logo {
    display: inline-block;
    width: 5rem;
    height: 5rem;
  }
</style>
