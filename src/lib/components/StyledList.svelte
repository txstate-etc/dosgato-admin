<script lang="ts">
</script>

<ul class='styled-list'>
  <slot/>
</ul>

<style>
  ul.styled-list {
    list-style: none;
    padding-left: 0;
  }
  :global(.styled-list li) {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0.3em;
  }
  :global(.styled-list li:first-child) {
    padding-top: 0;
  }
  :global(.styled-list li.flex-row) {
    display: flex;
    justify-content: space-between;
  }
  :global(.styled-list .flex-row button) {
    border: 0;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
  }
</style>