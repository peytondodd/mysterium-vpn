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

<script>
/**
 * Generic UI component to render unified Nav List
 */
export default {
  name: 'NavList',
  functional: true,
  props: {

  },
  components: {},
  render (h, { slots, data }) {
    let links = slots().item.map(slotItem => h('li', { class: 'nav__item' }, [slotItem]))

    const classNames = data.staticClass ? `nav__list ${data.staticClass}` : 'nav__list'
    return h('ul', { class: classNames }, links)
  }
}
</script>
