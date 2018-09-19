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
    <div class="page__post post">
      <h1>Connection History</h1>
      <div class="post__content">
        <table>
          <tr>
            <th/>
            <th>Node</th>
            <th>Date/Time</th>
            <th>Connection</th>
            <th>Duration</th>
            <th>Sent/Received</th>
          </tr>
          <tr
            v-for="record in records"
            :key="record.id">
            <td/>
            <td>[{{ record.country }}]{{ record.identity }}</td>
            <td>{{ record.start }}</td>
            <td>{{ record.status }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.sent }}/{{ record.received }}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name: 'ConnectionHistory',
  dependencies: ['tequilapiClient'],
  data: function () {
    return {
      records: []
    }
  },
  created: function () {
    this.tequilapiClient.connectionHistoryList().then(records => {
      this.records = records
    })
  }
}
</script>
