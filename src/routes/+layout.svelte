<script lang="ts">
  import { Icon, InlineMessage } from '@dosgato/dialog'
  import bag from '@iconify-icons/ph/bag-fill'
  import caretDown from '@iconify-icons/ph/caret-down-bold'
  import caretRightFill from '@iconify-icons/ph/caret-right-fill'
  import caretUp from '@iconify-icons/ph/caret-up-bold'
  import closeThick from '@iconify-icons/mdi/close-thick'
  import copySimple from '@iconify-icons/ph/copy-simple'
  import database from '@iconify-icons/ph/database'
  import doorOpenIcon from '@iconify-icons/ph/door-open'
  import fileCode from '@iconify-icons/ph/file-code'
  import globe from '@iconify-icons/ph/globe'
  import searchIcon from '@iconify-icons/ph/magnifying-glass'
  import userCircleLight from '@iconify-icons/ph/user-circle-light'
  import userIcon from '@iconify-icons/ph/user-circle-fill'
  import usersIcon from '@iconify-icons/ph/users'
  import xIcon from '@iconify-icons/ph/x-bold'
  import { eq, PopupMenu, type PopupMenuItem, resize, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { onMount, setContext, tick } from 'svelte'
  import { isNotNull } from 'txstate-utils'
  import { afterNavigate, goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { page } from '$app/stores'
  import { currentSubNav, globalStore, subNavSize, subnavStore, toasts, LabeledIconButton, TopNavLink, environmentConfig, uiLog, api, SearchInput } from '$lib'
  import { uiConfig } from '../local'
  import '../local/tracking.js'
  import '../normalize.css'
  import '../app.css'
  import type { IconOrSVG } from '@dosgato/templating'
  import { topSearchStore } from '$lib/stores/topsearch'

  uiLog.logger = uiConfig.uiInteractionsLogger ?? ((arg: any) => console.log('UI:', arg))
  $: uiLog.screen = $page.route.id ?? undefined

  export let data: { errObj: any }

  let buttonelement: HTMLButtonElement
  let profileelement: HTMLButtonElement
  let overflowbutton: HTMLButtonElement
  let navbutton: HTMLButtonElement
  let mobilesearchbutton: HTMLButtonElement
  const subnavLinks: HTMLAnchorElement[] = []
  $: subnavStore.setMaxItems(Math.floor(($subNavSize.clientWidth ?? 800) / 140))
  $: overflowItems = $currentSubNav?.links.slice($currentSubNav.maxItems).map(l => ({ value: l.href, label: l.label })) ?? []
  function onOverflowChange (e: any) {
    void goto(e.detail.value)
  }

  // TODO: Add Dashboard to the beginning of this list because, like Logout, it's part of Core
  const profileItems: (PopupMenuItem & { icon?: IconOrSVG })[] = [
    ...(uiConfig.profileMenuLinks ?? []).map(link => ({
      value: link.url,
      label: link.label,
      icon: link.icon
    })),
    { value: 'Logout', icon: doorOpenIcon }
  ]

  const profileIcons = profileItems.reduce<Record<string, IconOrSVG | undefined>>((acc, item) => ({ ...acc, [item.value]: item.icon }), {})

  function onProfileChange (e: any) {
    const item = e.detail as PopupMenuItem
    if (!item) return
    uiLog.log({ eventType: 'ProfileMenu', action: item.label ?? item.value }, item.value)
    if (item.value === 'Logout') {
      const token = sessionStorage.getItem('token')
      if (token) {
        sessionStorage.setItem('token', '')
        if (uiConfig.login.logout) {
          uiConfig.login.logout(environmentConfig, token)
        } else {
          location.reload()
        }
      }
    } else if (item.value) {
      void goto(item.value)
    }
  }

  function closeSubNav (i: number) {
    return () => {
      const identifiers = subnavStore.getActiveIdentifiers(i)
      uiLog.log({ eventType: 'SubNav', action: 'Close Tab', additionalProperties: { label: identifiers?.label } }, identifiers?.href)
      const href = subnavStore.close(i)
      if (href) void goto(href)
    }
  }

  let cookieAcquired = false
  let environmentTitle = ''
  onMount(() => {
    environmentTitle = uiConfig.environmentTitle?.(environmentConfig) ?? ''
    // populate the user's token to the render service so that it can create a cookie for itself
    // this way we can load images that require authentication in <img> tags and the editing iframe
    // will be authenticated
    // iframe works better here than `fetch` because of CORS and a firefox bug where iframes don't send
    // cookies created during a `fetch`
    const iframe = document.createElement('iframe')
    iframe.onload = () => {
      iframe.remove()
      cookieAcquired = true
    }
    iframe.src = `${environmentConfig.renderBase}/.token?token=${api.token}`
    iframe.style.height = '0px'
    document.body.append(iframe)
  })

  afterNavigate((nav) => {
    subnavStore.setMaxItems(Math.floor(($subNavSize.clientWidth ?? 800) / 140))
    if ($currentSubNav && subnavLinks.length > 1) {
      const selectedSubNavLink = subnavLinks.find(link => link.classList.contains('selected')) ?? subnavLinks[0]
      selectedSubNavLink.focus()
    }
    // Making a direct call to logger since after we navigate our uiLog.screen will be the target, not the originating screen.
    uiLog.logger({ eventType: 'navigation', action: nav.type.toString(), screen: nav.from?.url?.pathname, target: nav.to?.url?.pathname }, environmentConfig)
  })

  const labeledIconButtonTarget: { target: string | undefined } = { target: 'Profile-PopupMenu' }
  setContext('LabeledIconButtonTarget', { getTarget: () => labeledIconButtonTarget.target })

  function getLogo (): IconOrSVG | undefined {
    if (isNotNull(uiConfig.logo)) {
      if (typeof uiConfig.logo === 'object') return uiConfig.logo
      else return uiConfig.logo(environmentConfig)
    }
  }

  const navIconsByLabel = {
    Pages: fileCode,
    Assets: copySimple,
    Data: database,
    Sites: globe,
    Access: usersIcon,
    More: bag
  }

  function getTopNavItems () {
    const items: PopupMenuItem[] = []
    if ($globalStore.access.viewPageManager) items.push({ label: 'Pages', value: `${base}/pages` })
    if ($globalStore.access.viewAssetManager) items.push({ label: 'Assets', value: `${base}/assets` })
    if ($globalStore.access.viewDataManager) items.push({ label: 'Data', value: `${base}/data` })
    if ($globalStore.access.viewSiteManager) items.push({ label: 'Sites', value: `${base}/sites` })
    if ($globalStore.access.viewRoleManager) items.push({ label: 'Access', value: `${base}/auth/users` })
    if ($globalStore.access.manageTemplates) items.push({ label: 'More', value: `${base}/settings/templates/pages` })
    return items
  }

  function getNavLabel (path) {
    if (path.startsWith(`${base}/pages`)) return 'Pages'
    else if (path.startsWith(`${base}/assets`)) return 'Assets'
    else if (path.startsWith(`${base}/sites`)) return 'Sites'
    else if (path.startsWith(`${base}/auth`)) return 'Access'
    else if (path.startsWith(`${base}/data`)) return 'Data'
    else if (path.startsWith(`${base}/settings`)) return 'More'
    return ''
  }

  function onClickMobileNav (e: any) {
    void goto(e.detail.value)
  }

  let mobileNavMenuShown = false
  let mobileSearchShown = false

  async function toggleMobileSearch () {
    mobileSearchShown = !mobileSearchShown
    if (mobileSearchShown) {
      // Focus the search input when the search is opened
      await tick()
      const searchInput = document.querySelector('.search-mobile input')
      if (searchInput) (searchInput as HTMLInputElement).focus()
    } else {
      // Close the search input and focus the toggle button
      mobilesearchbutton?.focus()
    }
  }

  $: navlabel = getNavLabel($page.url.pathname)
  $: navIcon = navIconsByLabel[navlabel]

</script>

<svelte:head>
  <title>{environmentTitle} {uiConfig.title ?? 'DG Editing'}</title>
  {#if uiConfig.favicon}
    <link rel="icon" href="{typeof uiConfig.favicon === 'string' ? `${uiConfig.favicon}` : uiConfig.favicon(environmentConfig)}">
  {/if}
</svelte:head>

{#if data.errObj}
  {#if data.errObj.status === 403}
    You are not authorized to use this system. If you believe you should have access, please contact an administrator.

    <p><button type="button" on:click={() => onProfileChange({ detail: { value: 'Logout' } })}>Sign Out</button></p>
  {:else}
    There was an error with your request. Please try again later or contact support.
  {/if}
{:else}
  <nav>
    <div class="topbar" style:background-image={environmentTitle ? `url('data:image/svg+xml;utf8,<svg style="transform:rotate(45deg)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${(environmentTitle.length + 1) * 10} ${environmentTitle.length * 10}"><text x="0" y="25" fill="%23000" fill-opacity="0.1">${environmentTitle} </text></svg>')` : undefined}>
      <div class="left-topbar">
        <div class="logo">
          <Icon icon={getLogo()} width={getLogo()?.width} height={getLogo()?.height}/>
        </div>
        <ul class="topnav">
          {#if $globalStore.access.viewPageManager}<li class:selected={$page.url.pathname.startsWith(`${base}/pages`)}><TopNavLink href="{base}/pages" icon={fileCode} label="Pages"/></li>{/if}
          {#if $globalStore.access.viewAssetManager}<li class:selected={$page.url.pathname.startsWith(`${base}/assets`)}><TopNavLink href="{base}/assets" icon={copySimple} label="Assets" /></li>{/if}
          {#if $globalStore.access.viewDataManager}<li class:selected={$page.url.pathname.startsWith(`${base}/data`)}><TopNavLink href="{base}/data" icon={database} label="Data" /></li>{/if}
          {#if $globalStore.access.viewSiteManager}<li class="separator" class:selected={$page.url.pathname.startsWith(`${base}/sites`)}><TopNavLink href="{base}/sites" icon={globe} label="Sites" /></li>{/if}
          {#if $globalStore.access.viewRoleManager}<li class:separator={!$globalStore.access.viewSiteManager} class:selected={$page.url.pathname.startsWith(`${base}/auth`)}><TopNavLink href="{base}/auth/users" icon={usersIcon} label="Access" /></li>{/if}
          {#if $globalStore.access.manageTemplates}<li class:selected={$page.url.pathname.startsWith(`${base}/settings`)}><TopNavLink href="{base}/settings/templates/pages" icon={bag} label="More" /></li>{/if}
        </ul>
        <!-- Button with dropdown menu for mobile navigation -->
        <button type="button" bind:this={navbutton} class="mobile-nav reset" aria-expanded={mobileNavMenuShown}>
          <div class="nav-button-content">
            <Icon icon={navIcon}></Icon>
            {navlabel}
          </div>
          <Icon icon={mobileNavMenuShown ? caretUp : caretDown} />
        </button>
        <PopupMenu bind:menushown={mobileNavMenuShown} usemenurole buttonelement={navbutton} items={getTopNavItems()} showSelected={true} hideSelectedIndicator={true} on:change={onClickMobileNav} let:label menuContainerClass="profile-menu mobile-nav-menu" gap={-10}>
          <div class="menu-item">
            {#if isNotNull(navIconsByLabel[label])}
              <Icon icon={navIconsByLabel[label]} width="1.2em" />
            {/if}
            <span>{label}</span>
          </div>
        </PopupMenu>
      </div>
      <div class="right-topbar">
        <div class="search-desktop">
          <SearchInput searchStore={topSearchStore} />
        </div>
        <div class="toggle-search">
          <LabeledIconButton label={mobileSearchShown ? 'Close' : 'Search'} icon={mobileSearchShown ? xIcon : searchIcon} on:click={toggleMobileSearch} bind:buttonelement={mobilesearchbutton} aria-expanded={mobileSearchShown} />
        </div>
        <div class="profile-compact">
          <LabeledIconButton label="Profile" bind:buttonelement icon={userCircleLight} />
        </div>
        <button type="button" bind:this={profileelement} class="login-status reset" on:click={() => { uiLog.log({ eventType: 'button', action: 'LoginStatus' }, 'Login-PopupMenu') }} aria-expanded={false}>
          <Icon icon={userIcon} inline width="1.5em"/>
          {`${isNotNull($globalStore.me.lastname) ? `${$globalStore.me.firstname} ${$globalStore.me.lastname}` : 'Unauthorized User'}`}<ScreenReaderOnly>Application Actions</ScreenReaderOnly>
        </button>
        <PopupMenu usemenurole {buttonelement} items={profileItems} showSelected={false} on:change={onProfileChange} let:item let:label menuContainerClass="profile-menu" gap={5}>
          {@const icon = profileIcons[item.value]}
          <div class="menu-item">
            {#if icon}
              <Icon icon={icon} inline width="1.2em" />
            {/if}
            {label}
          </div>
        </PopupMenu>
        <PopupMenu usemenurole buttonelement={profileelement} items={profileItems} showSelected={false} on:change={onProfileChange} let:item let:label menuContainerClass="profile-menu" gap={5}>
          {@const icon = profileIcons[item.value]}
          <div class="menu-item">
            {#if icon}
              <Icon icon={icon} inline width="1.2em" />
            {/if}
            {label}
          </div>
        </PopupMenu>
      </div>
      {#if mobileSearchShown}
        <div class="search-mobile">
          <SearchInput searchStore={topSearchStore} on:escape={() => { toggleMobileSearch() }} />
        </div>
      {/if}
    </div>

    {#if $currentSubNav}
      <div class="subnav">
        <ul use:resize={{ store: subNavSize }}>
          {#each $currentSubNav.links.slice(0, $currentSubNav.maxItems) as link, i}
            {@const selected = $page.url.pathname === link.href || (!$currentSubNav.links.some(l => l.href === $page.url.pathname) && $page.url.pathname.startsWith(link.href))}
            <li class:selected class:closeable={link.closeable} style:flex-shrink={Math.pow(Math.max(0.00000001, link.label.length - 12), 0.5)}>
              <a bind:this={subnavLinks[i]} class:selected href={link.href}>{#if link.icon}<Icon icon={link.icon} inline/>{/if} {link.label}</a>
              {#if link.closeable}
                <button type="button" class="reset" on:click={closeSubNav(i)}><Icon icon={closeThick} inline hiddenLabel="Close {link.label}" width="1.2em" /></button>
              {/if}
            </li>
          {/each}
          {#if overflowItems.length}
            <li class="overflow"><button bind:this={overflowbutton} type="button"><Icon icon={caretRightFill} hiddenLabel="More Tabs Menu" inline /></button></li>
          {/if}
        </ul>
      </div>
    {/if}
  </nav>
  {#if overflowItems.length}<PopupMenu buttonelement={overflowbutton} items={overflowItems} value=".never" on:change={onOverflowChange}/>{/if}
  <main use:eq>
    {#if cookieAcquired}<slot />{/if}
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
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none 0 0/80px 80px;
    background-color: #f5f1ee;
    padding: 0.5em;
    color: #000;
    position: relative;
  }
  .left-topbar, .right-topbar {
    display: flex;
    align-items: center;
    gap: 1em;
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

  .topnav li:hover :global(a) {
    background-color: #d9d4cf;
  }

  .topnav li.selected :global(a){
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, white);
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
  button.mobile-nav {
    display: none;
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, #fff);
    height: 44px;
    border-radius: 12px;
    font-size: 0.9em;
    font-weight: 700;
    justify-content: space-between;
    align-items: center;
    gap: 0.125em;
    padding: 0.25em 0.75em 0.25em 0.375em;
    min-width: 150px;
    z-index: calc(var(--toast-z, calc(var(--modal-z, 3000) + 1)) + 1);
  }
  button.mobile-nav .nav-button-content {
    display: flex;
    gap: 0.5em;
    align-items: center;
  }
  .search-desktop {
    display: block;
  }
  .toggle-search {
    display: none;
  }
  .search-mobile {
    display: none;
  }
  .subnav ul {
    position: relative;
    width: 100%;
    display: flex;
    align-items: flex-end;
    gap: 4px;
    background-color: #CCCED1;
    padding: 6px 8px 0 8px;
  }
  .subnav li {
    position: relative;
    white-space: nowrap;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    color: #767676;
  }
  .subnav li.closeable {
    min-width: 1.5em;
    flex-basis: max-content;
  }
  .subnav li.overflow {
    min-width: 2em;
    display: flex;
    align-items: center;
    background-color: transparent !important;
  }
  .subnav li.overflow button {
    background: none;
    cursor: pointer;
    border: 0;
    color: black;
  }
  .subnav li a {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 0.5em;
    text-decoration: none;
    text-overflow: ellipsis;
    overflow: hidden;
    color: inherit;
    width: 100%;
    height: 28px;
  }
  .subnav li.closeable a {
   padding-right: 2.2em;
  }
  .subnav li:not(.selected) {
    background-color: #ebebeb;
  }
  .subnav li.selected {
    background-color: white;
    color: black;
  }
  .subnav li.selected a {
    height: 35px;
  }
  .subnav button.reset {
    position: absolute;
    top: 50%;
    right: 0.75em;
    transform: translateY(-50%);
    color: inherit;
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
  .topbar .logo > :global(*) {
   max-height: 50px;
   width: auto;
  }

  .login-status {
    display: flex;
    align-items: center;
    gap: 0.25em;
    height: 48px;
    padding: 0.25em 0.75em;
    border-radius: 12px;
  }

  :global(.login-status[aria-expanded="true"]) {
   background-color: var(--dg-button-bg, #501214);
  color: var(--dg-button-text, white);
  }

  :global(.profile-menu) {
    background-color: white;
    border: 1px solid #CCCED1;
    border-radius: 12px;
    box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.25);
  }

  :global(.profile-menu.mobile-nav-menu) {
    min-width: 148px;
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    border-top-color: white;
    padding-top: 7px;
  }

  :global(.profile-menu ul) {
    padding-inline-start: 0;
    margin: 0;
  }

  :global(.profile-menu .menu-item) {
    color: var(--dg-button-bg, #501214);
    padding: 10px 12px;
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 0.9em;
    font-weight: 700;
  }

  @media (max-width: 50em) {
    button.mobile-nav {
      display: flex;
    }
    .topnav {
      display: none;
    }
    .search-desktop {
      display: none;
    }
    .toggle-search {
      display: block;
    }
    .search-mobile {
      display: block;
      background-color: var(--dg-button-bg, #501214);
      padding: 0.75em 0.5em;
      position: absolute;
      right: 0;
      top: 100%;
      z-index: calc(var(--modal-z, 3000) + 1);
    }
    .toggle-search :global(button[aria-expanded="true"]) {
      background-color: var(--dg-button-bg, #501214);
      color: var(--dg-button-text, white);
    }
  }

  @media (max-width: 30em) {
    .topbar .logo {
      display: none;
    }
    .topnav li, .profile-compact, .toggle-search {
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
