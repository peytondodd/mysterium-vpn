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
  <div class="page">
    <close-button
      :click="close"
      class="close-button--marginned"/>
    <div class="page__post post">
      <h1>Connection History</h1>
      <div class="post__content connection-history">
        <table>
          <tr>
            <th>Node</th>
            <th>Date/Time</th>
            <th>Duration</th>
            <th>Received/Sent</th>
          </tr>
          <session-item
            v-for="sessionItem in sessionItems"
            :key="sessionItem.id"
            :value="sessionItem"/>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
import SessionItem from '../components/session-item'
import CloseButton from '../components/close-button'
import logger from '../../app/logger'
import { SessionItemList } from '../../app/sessions/session-item-list'

export default {
  name: 'ConnectionHistory',
  components: { CloseButton, SessionItem },
  dependencies: ['tequilapiClient', 'timeFormatter', 'durationFormatter', 'bytesFormatter'],
  data: function () {
    return {
      sessionItems: []
    }
  },
  created: function () {
    const list =
      new SessionItemList(this.tequilapiClient, this.timeFormatter, this.durationFormatter, this.bytesFormatter)
    list.fetchItems().then(items => {
      this.sessionItems = items
    }).catch(error => {
      logger.error('Fetching sessions failed', error)
    })
  },
  methods: {
    close: function () {
      this.$router.push('/vpn')
    }
  }
}
</script>
