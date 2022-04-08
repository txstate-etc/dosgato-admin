<script lang="ts" context="module">
  import { Icon } from '@dosgato/dialog'
  import accountMultiple from '@iconify-icons/mdi/account-multiple'
  import chartLine from '@iconify-icons/mdi/chart-line'
  import cogOutline from '@iconify-icons/mdi/cog-outline'
  import databaseOutline from '@iconify-icons/mdi/database-outline'
  import fileCodeOutline from '@iconify-icons/mdi/file-code-outline'
  import fileImageOutline from '@iconify-icons/mdi/file-image-outline'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import webIcon from '@iconify-icons/mdi/web'
  import type { Load } from '@sveltejs/kit'
  import { PopupMenu, type PopupMenuItem } from '@txstate-mws/svelte-components'
  import { base } from '$app/paths'
  import { api, subnav } from '$lib'
  import { getToken } from '../local'

  export const load: Load = async (input) => {
    api.fetch = input.fetch
    api.token = getToken(input)
    if (api.token) {
      sessionStorage.setItem('token', api.token)
    } else {
      api.token = sessionStorage.getItem('token')
    }
    const me = await api.query('query getSelf { users (filter:{ ids: ["self"] }) { name } }')
    return { props: { me: me.users[0] } }
  }
</script>
<script lang="ts">
  import { page } from '$app/stores'
  export let me: { name: string }
  let buttonelement: HTMLElement

  const profileItems: PopupMenuItem[] = [
    { value: 'Logout' }
  ]

  $: showsubnav = $subnav.length > 0 && ['auth', 'pages'].some(section => $page.url.pathname.startsWith(base + '/' + section))

  function onProfileChange (e: any) {
    if (e.detail.value === 'Logout') {
      sessionStorage.setItem('token', '')
      const url = new URL(location.href)
      url.search = ''
      location.replace(url)
    }
  }
</script>

<nav>
  <div class="topbar">
    <div class="logo"></div>
    <ul class="topnav">
      <li><a href="{base}/pages"><Icon icon={fileCodeOutline} width="2.5em" hiddenLabel="Pages" /></a></li>
      <li><a href="{base}/assets"><Icon icon={fileImageOutline} width="2.5em" hiddenLabel="Assets" /></a></li>
      <li><a href="{base}/data"><Icon icon={databaseOutline} width="2.5em" hiddenLabel="Data" /></a></li>
      <li><a href="{base}/sites"><Icon icon={webIcon} width="2.5em" hiddenLabel="Sites" /></a></li>
      <li><a href="{base}/settings"><Icon icon={cogOutline} width="2.5em" hiddenLabel="Settings" /></a></li>
      <li><a href="{base}/reports"><Icon icon={chartLine} width="2.5em" hiddenLabel="Reports" /></a></li>
      <li><a href="{base}/auth/users"><Icon icon={accountMultiple} width="2.5em" hiddenLabel="Users and Roles" /></a></li>
    </ul>
    <button bind:this={buttonelement} class="login-status reset">
      {me.name}
      <Icon icon={menuDown} inline />
    </button>
  </div>
  {#if showsubnav}
    <div class="subnav">
      <ul>
        {#each $subnav as link}
          {@const selected = $page.url.pathname === link.href}
          <li class:selected><a href={link.href}>{#if link.icon}<Icon icon={link.icon} inline/>{/if}{link.label}</a></li>
        {/each}
      </ul>
      <div></div>
    </div>
  {/if}
</nav>
<PopupMenu {buttonelement} items={profileItems} showSelected={false} on:change={onProfileChange} />
<main>
  <slot />
</main>

<style>
  nav {
    margin-bottom: 1em;
  }
  .topbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #444444;
    background-color: #501214;
    padding: 0.5em;
  }
  .topbar, .topbar a {
    color: white;
  }
  nav ul {
    padding: 0;
    margin: 0;
    list-style: none;
    display: flex;
  }
  ul.topnav {
    justify-content: center;
  }
  .topnav li {
    margin-left: 0.5em;
  }
  .subnav {
    width: 100%;
    display: flex;
    background-color: #f5f1ee;
  }
  .subnav div {
    flex-grow: 1;
    border-bottom: 1px solid #888888;
  }
  .subnav li {
    border-right: 1px solid #888888;
  }
  .subnav li a {
    display: block;
    padding: 0.35em 1.5em;
    text-decoration: none;
    color: black;
  }
  .subnav li:not(.selected) {
    border-bottom: 1px solid #888888;
  }
  .subnav li.selected {
    background-color: white;
  }
  :global(button.reset) {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }
</style>
