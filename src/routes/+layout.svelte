<script lang="ts">
  import { Icon, InlineMessage } from '@dosgato/dialog'
  import closeThick from '@iconify-icons/mdi/close-thick'
  import copySimpleLight from '@iconify-icons/ph/copy-simple-light'
  import dotsThree from '@iconify-icons/ph/dots-three'
  import databaseLight from '@iconify-icons/ph/database-light'
  import fileCodeLight from '@iconify-icons/ph/file-code-light'
  import globeLight from '@iconify-icons/ph/globe-light'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import userCircleLight from '@iconify-icons/ph/user-circle-light'
  import usersLight from '@iconify-icons/ph/users-light'
  import { eq, PopupMenu, type PopupMenuItem } from '@txstate-mws/svelte-components'
  import { isNotNull } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { page } from '$app/stores'
  import { currentSubNav, globalStore, subnavStore, toasts, LabeledIcon, LabeledIconButton, environmentConfig } from '$lib'
  import { uiConfig } from '../local'
  import '../local/tracking.js'

  uiConfig.tracing?.init?.(environmentConfig)

  export let data: { errObj: any }

  let buttonelement: HTMLButtonElement
  let profileelement: HTMLButtonElement

  const profileItems: PopupMenuItem[] = [
    { value: 'Logout' }
  ]

  function onProfileChange (e: any) {
    if (e.detail.value === 'Logout') {
      const token = sessionStorage.getItem('token')
      if (token) {
        sessionStorage.setItem('token', '')
        if (uiConfig.login.logout) {
          uiConfig.login.logout(environmentConfig, token)
        } else {
          location.reload()
        }
      }
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
      <div class="logo">
        <Icon icon={uiConfig.logo} width={uiConfig.logo?.width} height={uiConfig.logo?.height}/>
      </div>
      <ul class="topnav">
        {#if $globalStore.access.viewPageManager}<li class:selected={$page.url.pathname.startsWith(`${base}/pages`)}><LabeledIcon href="{base}/pages" icon={fileCodeLight} label="Pages"/></li>{/if}
        {#if $globalStore.access.viewAssetManager}<li class:selected={$page.url.pathname.startsWith(`${base}/assets`)}><LabeledIcon href="{base}/assets" icon={copySimpleLight} label="Assets" /></li>{/if}
        {#if $globalStore.access.viewDataManager}<li class:selected={$page.url.pathname.startsWith(`${base}/data`)}><LabeledIcon href="{base}/data" icon={databaseLight} label="Data" /></li>{/if}
        {#if $globalStore.access.viewSiteManager}<li class="separator" class:selected={$page.url.pathname.startsWith(`${base}/sites`)}><LabeledIcon href="{base}/sites" icon={globeLight} label="Sites" /></li>{/if}
        {#if $globalStore.access.viewRoleManager}<li class:separator={!$globalStore.access.viewSiteManager} class:selected={$page.url.pathname.startsWith(`${base}/auth`)}><LabeledIcon href="{base}/auth/users" icon={usersLight} label="Access" /></li>{/if}
        {#if $globalStore.access.manageTemplates}<li class:selected={$page.url.pathname.startsWith(`${base}/settings`)}><LabeledIcon href="{base}/settings/templates" icon={dotsThree} label="More" /></li>{/if}
      </ul>
      <div class="profile-compact">
        <LabeledIconButton label="Profile" bind:buttonelement icon={userCircleLight} />
      </div>
      <button type="button" bind:this={profileelement} class="login-status reset">
        {`${isNotNull($globalStore.me.lastname) ? `${$globalStore.me.firstname} ${$globalStore.me.lastname}` : 'Unauthorized User'}`}
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
  <PopupMenu buttonelement={profileelement} items={profileItems} showSelected={false} on:change={onProfileChange} />
  <main use:eq>
    <slot />
  </main>
  {#if $toasts.length > 1}
    <ul class="toasts" aria-live="assertive">
      {#each $toasts as toast}
        <li><InlineMessage message={{ message: toast.message, type: toast.type }} /></li>
      {/each}
    </ul>
  {:else if $toasts.length}
    <div class="toasts" aria-live="assertive">
      <InlineMessage message={{ message: $toasts[0].message, type: $toasts[0].type }} />
    </div>
  {/if}
{/if}

<style>
  @import url(../normalize.css);
  @import url(../app.css);
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f1ee;
    padding: 0.5em;
    color: #000;
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
    border-radius: 4px;
  }
  .topnav li :global(a) {
    border-radius: 4px;
    padding: 4px 2px;
  }
  .topnav li:hover :global(a) {
    background-color: #d9d4cf;
  }

  .topnav li.selected :global(a){
    background-color: #fcfcfc;
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
    background-color: #ccc;
  }
  .subnav div {
    flex-grow: 1;
  }
  .subnav li {
    position: relative;
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
    background-color: #ebebeb;
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
    width: 50vw;
    min-width: 300px;
    max-width: 900px;
    padding: 0;
    margin: 0;
    list-style: none;
    z-index: var(--toast-z, calc(var(--modal-z, 3000) + 1));
  }

  @media (max-width: 30em) {
    .topbar .logo {
      display: none;
    }
    .topnav li, .profile-compact {
      font-size: 0.85rem;
    }
    button.login-status {
      display: none;
    }
  }
  @media (min-width: 30em) {
    .profile-compact {
      display: none;
    }
  }
</style>
