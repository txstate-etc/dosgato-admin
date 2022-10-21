<script lang="ts">
  import { Icon, InlineMessage } from '@dosgato/dialog'
  import usersLight from '@iconify-icons/ph/users-light'
  import closeThick from '@iconify-icons/mdi/close-thick'
  import dotsThree from '@iconify-icons/ph/dots-three'
  import databaseLight from '@iconify-icons/ph/database-light'
  import fileCodeLight from '@iconify-icons/ph/file-code-light'
  import copySimpleLight from '@iconify-icons/ph/copy-simple-light'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import globeLight from '@iconify-icons/ph/globe-light'
  import { PopupMenu, type PopupMenuItem } from '@txstate-mws/svelte-components'
  import { base } from '$app/paths'
  import { page } from '$app/stores'
  import { currentSubNav, globalStore, subnavStore, toasts } from '$lib'
  import LabeledIcon from '$lib/components/LabeledIcon.svelte'
  import { goto } from '$app/navigation'

  export let data: { errObj: any }

  let buttonelement: HTMLElement

  const profileItems: PopupMenuItem[] = [
    { value: 'Logout' }
  ]

  function onProfileChange (e: any) {
    if (e.detail.value === 'Logout') {
      sessionStorage.setItem('token', '')
      const url = new URL(location.href)
      url.search = ''
      location.replace(url)
    }
  }

  function closeSubNav (i: number) {
    return () => {
      const href = subnavStore.close(i)
      if (href) goto(href)
    }
  }
</script>

{#if data.errObj}
  {#if data.errObj.status === 403}
    You are not authorized to use this system. If you believe you should have access, please contact an administrator.

    <p><button type="button" on:click={() => onProfileChange({ detail: { value: 'Logout' } })}>Sign Out</button></p>
  {:else}
    There was an error with your request. Please try again later or contact support.
  {/if}
{:else}
  <nav>
    <div class="topbar">
      <div class="logo"></div>
      <ul class="topnav">
        {#if $globalStore.access.viewPageManager}<li><LabeledIcon href="{base}/pages" icon={fileCodeLight} label="Pages"/></li>{/if}
        {#if $globalStore.access.viewAssetManager}<li><LabeledIcon href="{base}/assets" icon={copySimpleLight} label="Assets" /></li>{/if}
        {#if $globalStore.access.viewDataManager}<li><LabeledIcon href="{base}/data" icon={databaseLight} label="Data" /></li>{/if}
        {#if $globalStore.access.viewSiteManager}<li class="separator"><LabeledIcon href="{base}/sites" icon={globeLight} label="Sites" /></li>{/if}
        {#if $globalStore.access.viewRoleManager}<li class:separator={!$globalStore.access.viewSiteManager}><LabeledIcon href="{base}/auth/users" icon={usersLight} label="Access" /></li>{/if}
        {#if $globalStore.access.viewSiteManager}<li><LabeledIcon href="{base}/settings/templates" icon={dotsThree} label="More" /></li>{/if}
      </ul>
      <button bind:this={buttonelement} class="login-status reset">
        {$globalStore.me.name || 'Unauthorized User'}
        <Icon icon={menuDown} inline />
      </button>
    </div>
    {#if $currentSubNav}
      <div class="subnav">
        <ul>
          {#each $currentSubNav.links as link, i}
            {@const selected = $page.url.pathname === link.href || (!$currentSubNav.links.some(l => l.href === $page.url.pathname) && $page.url.pathname.startsWith(link.href))}
            <li class:selected class:closeable={link.closeable}>
              <a href={link.href}>{#if link.icon}<Icon icon={link.icon} inline/>{/if}{link.label}</a>
              {#if link.closeable}
                <button type="button" class="reset" on:click={closeSubNav(i)}><Icon icon={closeThick} inline hiddenLabel="Close {link.label}" width="1.2em" /></button>
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
  {#if $toasts.length}
    <ul class="toasts" aria-live="assertive">
      {#each $toasts as toast}
        <InlineMessage message={{ message: toast.message, type: toast.type }} />
      {/each}
    </ul>
  {/if}
{/if}

<style>
  @import url(../normalize.css);
  @import url(../app.css);
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

  .toasts {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    min-width: 10em;
  }
</style>
