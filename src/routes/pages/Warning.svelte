<script lang="ts">
  import { randomid } from 'txstate-utils'
  export let message: string
  export let open: boolean = false
  export let messageId: string = randomid()
</script>

<dialog open={open}>
  <div class="content">
    <div class="icon">
      <svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.7931 17.9114C22.0668 18.4197 22.0668 19.0061 21.7931 19.4752C21.5195 19.9834 21.0112 20.2571 20.4639 20.2571H3.57518C2.98876 20.2571 2.48054 19.9834 2.20688 19.4752C1.93322 19.0061 1.93322 18.4197 2.20688 17.9114L10.6512 3.52473C10.9249 3.05559 11.4331 2.74284 12.0195 2.74284C12.5669 2.74284 13.0751 3.05559 13.3488 3.52473L21.7931 17.9114ZM15.0762 2.51348L15.0777 2.51616L23.538 16.93L23.5555 16.9625C24.1294 18.0283 24.1722 19.3444 23.5393 20.454C22.8879 21.637 21.6838 22.2587 20.4639 22.2587H3.57518C2.34516 22.2587 1.12477 21.6603 0.460681 20.4539C-0.172198 19.3444 -0.129382 18.0282 0.444499 16.9625L0.461978 16.93L8.92228 2.51616L8.92396 2.51329C9.54626 1.44877 10.7019 0.741211 12.0195 0.741211C13.326 0.741211 14.4684 1.47375 15.0762 2.51348ZM12.9067 13.3785C12.9398 13.2815 12.9578 13.1759 12.9578 13.0637V8.68517C12.9578 8.17695 12.5278 7.74691 12.0195 7.74691C11.4722 7.74691 11.0813 8.17695 11.0813 8.68517V13.0637C11.0813 13.1745 11.0973 13.2788 11.1274 13.3748C11.2459 13.7532 11.583 14.002 12.0195 14.002C12.4236 14.002 12.7783 13.7548 12.9067 13.3785ZM10.9757 15.8208C10.8443 16.0203 10.7685 16.2567 10.7685 16.504C10.7685 17.2077 11.3158 17.7551 12.0195 17.7551C12.6842 17.7551 13.2706 17.2077 13.2706 16.504C13.2706 16.2554 13.1885 16.0178 13.051 15.8177C12.8209 15.4828 12.4355 15.253 12.0195 15.253C11.5777 15.253 11.1975 15.4842 10.9757 15.8208Z" fill="black"/>
      </svg>
    </div>
    <p id={messageId}>{@html message}</p>
    <form method="dialog">
      <button>Dismiss</button>
    </form>
  </div>
</dialog>

<style>
  dialog {
    background-color: #F3D690;
    padding: 0.5em;
    border-width: 0;
    position: relative;
    width: 100%;
    margin-bottom: 1em;
  }
  dialog .content {
    display: flex;
    gap: 0.5em;
    align-items: center;
  }
  dialog .content .icon svg {
    height: 30px;
    width: 31px;
  }
  dialog .content p {
    margin: 0;
  }
  dialog .content form {
    align-self: flex-start;
  }
  dialog .content button {
    background-color: transparent;
    border: 0;
    color: #069;
    text-decoration: underline;
    font-size: 12px;
    font-weight: 700;
  }
</style>
