<script>
  export let size = '1em'
</script>

<i aria-hidden="true" style:width={size} style:padding-top={size}></i>

<style>
  i {
    display: inline-block;
    box-sizing: content-box;
    border-color: var(--loadicon-bg-color, #FFFFFF);
    border-top-color: var(--loadicon-moving-color, #333333);
    border-style: solid;
    border-radius: 50%;
    animation: spin 2s linear infinite;
    margin-left: 0.3em;
    vertical-align: middle;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
