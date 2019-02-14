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
  <img
    class="quality-indicator"
    :src="imagePath">
</template>

<script>
import path from 'path'
import { QualityLevel } from 'mysterium-vpn-js'

export default {
  name: 'QualityIndicator',
  props: {
    level: {
      type: Number,
      default: null
    }
  },
  computed: {
    iconName: function () {
      if (this.level === QualityLevel.LOW) {
        return 'low'
      } else if (this.level === QualityLevel.MEDIUM) {
        return 'medium'
      } else if (this.level === QualityLevel.HIGH) {
        return 'high'
      } else if (this.level === QualityLevel.UNKNOWN) {
        return 'unknown'
      } else {
        throw new Error(`Unknown quality level value: ${this.level}`)
      }
    },
    imagePath: function () {
      return path.join('static', 'icons', 'quality', this.iconName + '.png')
    }
  }
}
</script>
