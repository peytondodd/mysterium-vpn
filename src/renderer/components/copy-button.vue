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
  <span
    class="copy-btn"
    @click="copyId()">
    <icon-copy class="nav__icon nav__icon--eye"/>

    <span
      v-if="isCopied"
      class="copy-btn__tooltip-success">
      Copied!
    </span>
    <span
      v-else
      class="copy-btn__tooltip">
      Copy to Clipboard
    </span>
  </span>
</template>

<script>
import { clipboard } from 'electron'
import IconCopy from '@/assets/img/icon--copy.svg'

const COPIED_POPUP_TIMEOUT = 1500

export default {
  name: 'CopyButton',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  components: {
    IconCopy
  },
  data () {
    return {
      isCopied: false
    }
  },
  methods: {
    copyId () {
      clipboard.writeText(this.text)
      this.isCopied = true

      const self = this
      setTimeout(() => {
        self.isCopied = false
      }, COPIED_POPUP_TIMEOUT)
    }
  }
}
</script>
