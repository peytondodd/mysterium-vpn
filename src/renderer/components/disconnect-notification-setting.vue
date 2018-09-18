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
  <div class="round-checkbox">
    <label
      class="outer"
      for="checkbox"
      @click="toggle">Notify on disconnect</label>
    <input
      type="checkbox"
      id="checkbox"
      v-model="isDisconnectNotificationEnabled" >
    <label
      class="inner"
      for="checkbox"
      @click="toggle" />
  </div>
</template>

<script>
import { userSettingName } from '../../app/user-settings/user-settings-store'

export default {
  name: 'DisconnectNotificationSetting',
  dependencies: ['rendererCommunication', 'userSettingsStore'],
  data () {
    return {
      isDisconnectNotificationEnabled: true
    }
  },
  mounted () {
    this.userSettingsStore.onChange(userSettingName.showDisconnectNotifications, this.updateNotificationSetting)
  },
  beforeDestroy () {
    this.userSettingsStore.removeOnChange(userSettingName.showDisconnectNotifications, this.updateNotificationSetting)
  },
  methods: {
    toggle () {
      this.isDisconnectNotificationEnabled = !this.isDisconnectNotificationEnabled
      this.userSettingsStore.setShowDisconnectNotifications(this.isDisconnectNotificationEnabled)
    },
    updateNotificationSetting (showNotifications) {
      this.isDisconnectNotificationEnabled = showNotifications
    }
  }
}
</script>
