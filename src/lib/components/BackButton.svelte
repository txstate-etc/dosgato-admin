<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import arrowLeft from '@iconify-icons/mdi/arrow-left'
  export let url: string
  export let destination: string
</script>

<a href={url}>
  <Icon icon={arrowLeft}/>
  <span>Back to {destination}</span>
</a>

<style>
  a {
    background-color: #501214;
    color: #ffffff;
    padding: 10px 15px;
    text-decoration: none;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
  }
  span {
    margin-left: 0.5em;
  }
</style>

