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
    <a
      href="#"
      @click.prevent="onClick('vpn')"
      class="tab__button"
      :class="{'tab__button--active': activeRoute('vpn')}">
      Use VPN
    </a>

    <a
      href="#"
      @click.prevent="onClick('provider')"
      class="tab__button"
      :class="{'tab__button--active': activeRoute('provider')}">
      Run service
    </a>
  </div>
</template>

<script>
export default {
  props: {
    onClick: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    activeRoute (routeName) {
      const currentRoute = this.getCurrentRoute() || 'vpn'

      return routeName === currentRoute
    },
    getCurrentRoute () {
      if (!this.$router || !this.$router.currentRoute) {
        return null
      }

      return this.$router.currentRoute.name
    }
  }
}
</script>
