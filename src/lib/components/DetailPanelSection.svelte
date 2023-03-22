<script lang="ts">
  export let hasBackground = false
  export let addTopBorder = false
</script>

<div class:hasBackground class:addTopBorder>
  <slot/>
</div>

<style>
  div {
    padding: 0.5em 1.5em;
  }
  div.hasBackground {
    background-color: #e5e5e5;
  }
  div.addTopBorder {
    border-top: 2px solid black;
  }
</style>