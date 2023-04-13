<script lang="ts">
  import { DetailPanel, DetailPanelSection, type SiteComment } from '$lib'
  import plusIcon from '@iconify-icons/ph/plus-light'
  import { createEventDispatcher } from 'svelte'
  import { eq } from '@txstate-mws/svelte-components'
  import { DateTime } from 'luxon'

  export let headerColor: string
  export let comments: SiteComment[]
  const dispatch = createEventDispatcher()
</script>
<DetailPanel header="Audit"  {headerColor} button={{ icon: plusIcon, hiddenLabel: 'add comment', onClick: () => { dispatch('addauditcomment') } }}>
  <DetailPanelSection>
    {#if comments.length}
      <ul use:eq>
        {#each comments as comment (comment.id)}
          <li class='comment-card'>
            <span class="comment-text">{comment.comment}</span>
            <div>
              <span class="comment-date">{DateTime.fromISO(comment.createdAt).toFormat('LLL d, yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>
              <span class="comment-creator">{comment.createdBy.id}</span>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      No comments found.
    {/if}
  </DetailPanelSection>
</DetailPanel>

<style>
  ul {
    list-style: none;
    padding-left: 0;
  }
  li {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0em;
  }
  li.comment-card {
    display: flex;
    flex-direction: column;
    padding: 0.5em;
  }
  li.comment-card .comment-text {
    margin-bottom: 0.5em;
  }
  li.comment-card div {
    display: flex;
    justify-content: space-between;
  }
  li.comment-card div span {
    width: 50%;
  }
  li.comment-card .comment-creator {
    text-align: right;
  }
  [data-eq~="400px"] li.comment-card div {
    flex-direction: column;
    align-items: flex-end;
  }
  [data-eq~="400px"] li.comment-card div span {
    width: auto;
  }
</style>