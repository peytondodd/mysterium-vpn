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
  <div class="tabs">
    <router-link
      :to="{ name: 'vpn' }"
      class="tab__button"
      :class="{'tab__button--active': activeRoute('vpn')}">
      Use VPN
    </router-link>

    <router-link
      :to="{ name: 'provider' }"
      class="tab__button"
      :class="{'tab__button--active': activeRoute('provider')}">
      Run service
    </router-link>
  </div>
</template>

<script>
export default {
  methods: {
    activeRoute (routeName) {
      return this.$router.currentRoute.name === routeName
    }
  }
}
</script>
