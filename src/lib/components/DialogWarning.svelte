<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import warningIcon from '@iconify-icons/ph/warning'

  export let text
</script>

<div>
  <span class="warning"><Icon icon={warningIcon} width="3em"/></span>
  <span>{text}</span>
</div>

<style>
  span.warning {
    color: var(--dosgato-yellow, #ffbf28)
  }
  div {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 1em;
  }
</style>