<script lang="ts" context="module">
  import { Icon } from '@dosgato/dialog'
  import accountMultiple from '@iconify-icons/mdi/account-multiple'
  import closeThick from '@iconify-icons/mdi/close-thick'
  import cogOutline from '@iconify-icons/mdi/cog-outline'
  import databaseOutline from '@iconify-icons/mdi/database-outline'
  import fileCodeOutline from '@iconify-icons/mdi/file-code-outline'
  import imageMultipleOutline from '@iconify-icons/mdi/image-multiple-outline'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import webIcon from '@iconify-icons/mdi/web'
  import type { Load } from '@sveltejs/kit'
  import { PopupMenu, type PopupMenuItem } from '@txstate-mws/svelte-components'
  import { base } from '$app/paths'
  import { api, globalStore, subnav, type SubNavLink } from '$lib'
  import { getToken } from '../local'

  export const load: Load = async (input) => {
    api.fetch = input.fetch
    api.token = getToken(input)
    if (api.token) {
      sessionStorage.setItem('token', api.token)
    } else {
      api.token = sessionStorage.getItem('token') ?? undefined
    }
    const { me, access } = await api.getSelf()
    globalStore.update(v => ({ ...v, me, access }))
    return {}
  }
</script>
<script lang="ts">
  import { page } from '$app/stores'
  import LabeledIcon from '$lib/components/LabeledIcon.svelte'
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

  function closeSubNav (link: SubNavLink, i: number) {
    return () => {
      link.onClose?.(i)
    }
  }
</script>

<nav>
  <div class="topbar">
    <div class="logo"></div>
    <ul class="topnav">
      {#if $globalStore.access.viewPageManager}<li><LabeledIcon href="{base}/pages" icon={fileCodeOutline} label="Pages"/></li>{/if}
      {#if $globalStore.access.viewAssetManager}<li><LabeledIcon href="{base}/assets" icon={imageMultipleOutline} label="Assets" /></li>{/if}
      {#if $globalStore.access.viewDataManager}<li><LabeledIcon href="{base}/data" icon={databaseOutline} label="Data" /></li>{/if}
      {#if $globalStore.access.viewSiteManager}<li class="separator"><LabeledIcon href="{base}/sites" icon={webIcon} label="Sites" /></li>{/if}
      {#if $globalStore.access.viewSiteManager}<li><LabeledIcon href="{base}/settings" icon={cogOutline} label="Admin" /></li>{/if}
      {#if $globalStore.access.viewRoleManager}<li class:separator={!$globalStore.access.viewSiteManager}><LabeledIcon href="{base}/auth/users" icon={accountMultiple} label="Roles" /></li>{/if}
    </ul>
    <button bind:this={buttonelement} class="login-status reset">
      {$globalStore.me.name}
      <Icon icon={menuDown} inline />
    </button>
  </div>
  {#if showsubnav}
    <div class="subnav">
      <ul>
        {#each $subnav as link, i}
          {@const selected = $page.url.pathname === link.href}
          <li class:selected class:closeable={!!link.onClose}>
            <a href={link.href}>{#if link.icon}<Icon icon={link.icon} inline/>{/if}{link.label}</a>
            {#if link.onClose}
              <button type="button" class="reset" on:click={closeSubNav(link, i)}><Icon icon={closeThick} inline hiddenLabel="Close {link.label}" width="1.2em" /></button>
            {/if}
          </li>
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
  .topbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #444444;
    background-color: #501214;
    padding: 0.5em;
  }
  .topbar {
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
  .topnav li.separator {
    position: relative;
    margin-left: 1em;
    padding-left: 1em;
  }
  .topnav li.separator:before {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    content: ' ';
    border-left: 2px solid currentColor;
    height: 50%;
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
    position: relative;
    border-right: 1px solid #888888;
  }
  .subnav li a {
    display: block;
    padding: 0.35em 1.5em;
    text-decoration: none;
    color: inherit;
  }
  .subnav li.closeable a {
    padding: 0.35em 1.7em 0.35em 1em;
  }
  .subnav li:not(.selected) {
    border-bottom: 1px solid #888888;
  }
  .subnav li.selected {
    background-color: white;
  }
  .subnav button.reset {
    position: absolute;
    top: 50%;
    right: 0.2em;
    transform: translateY(-50%);
    color: var(--dosgato-page-close, #333333);
  }
  .subnav button.reset :global(svg) {
    display: block;
  }

  main {
    padding: 1em;
  }
</style>
