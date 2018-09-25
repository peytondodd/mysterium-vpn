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
  <tr>
    <td/>
    <td>[{{ session.provider.country }}]{{ shortIdentity }}</td>
    <td>{{ startString }}</td>
    <td class="status">
      <div
        class="connection-history__status"
        :class="`connection-history__status--${status_modifier}`">
        {{ session.status }}
      </div>
    </td>
    <td>{{ durationString }}</td>
    <td>{{ sent }}/{{ received }}</td>
  </tr>
</template>

<script>
import { bytesReadableOrDefault, timeDisplayOrDefault } from '../../libraries/unit-converter'
import { getReadableDate, getReadableTime } from '../../libraries/strings'

// TODO: handle unknown statuses
function getStatusModifier (status) {
  if (status === 'Successful') {
    return 'success'
  }
  if (status === 'Unsuccessful') {
    return 'failure'
  }
  if (status === 'Cancelled') {
    return 'cancelled'
  }
  return ''
}

export default {
  name: 'SessionItem',
  props: {
    session: {
      type: Object,
      required: true
    }
  },
  computed: {
    durationString: function () {
      return timeDisplayOrDefault(this.session.duration)
    },
    status_modifier: function () {
      return getStatusModifier(this.session.status)
    },
    sent: function () {
      const sent = bytesReadableOrDefault(this.session.bytesSent)
      return sent.value + sent.units
    },
    received: function () {
      const received = bytesReadableOrDefault(this.session.bytesReceived)
      return received.value + received.units
    },
    shortIdentity: function () {
      return this.session.provider.identity.slice(0, 11) + '...'
    },
    startString: function () {
      const date = new Date(this.session.start)
      return getReadableDate(date) + '\n' + getReadableTime(date)
    }
  }
}
</script>
