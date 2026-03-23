<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import browserIcon from '@iconify-icons/ph/browser-bold'
  import hammerIcon from '@iconify-icons/ph/hammer-bold'
  import archiveIcon from '@iconify-icons/ph/archive-bold'
  export let item: { type: string, launchState: string }
  let state = 'ARCHIVE'
  if (item.type === 'PRIMARY') {
    if (item.launchState === 'LAUNCHED') {
      state = 'LIVE'
    } else if (item.launchState === 'PRELAUNCH') {
      state = 'SANDBOX'
    }
  } else if (item.type === 'SANDBOX') {
    state = 'SANDBOX'
  }
</script>

<div class="pagetree-status {state.toLowerCase()}">
  <Icon icon={state === 'LIVE' ? browserIcon : (state === 'SANDBOX' ? hammerIcon : archiveIcon)} width="1.2em" />
  {state}
</div>

<style>
  .pagetree-status {
    padding: 6px 8px;
    border-radius: 8px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .pagetree-status.live {
    background-color: var(--dashboard-live-accent);
    color: #fff;
  }
  .pagetree-status.archive {
    background-color: var(--dashboard-archive-accent);
    color: #fff;
  }
  .pagetree-status.sandbox {
    background-color: var(--dashboard-sandbox-accent);
    color: #fff;
  }
</style>
