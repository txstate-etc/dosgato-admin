<script lang="ts">
  export let hasBackground = false
  export let addTopBorder = false
  export let lastSection = false
</script>

<div class:hasBackground class:addTopBorder class:lastSection>
  <slot/>
</div>

<style>
  div {
    padding: 0.5em 1.5em;
  }
  div.hasBackground {
    background-color: #e5e5e5;
  }
  div.hasBackground.lastSection {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
  div.addTopBorder {
    border-top: 2px solid black;
  }
</style>
