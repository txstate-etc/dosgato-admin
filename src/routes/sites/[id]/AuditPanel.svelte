<script lang="ts">
  import { DetailPanel, DetailPanelSection, type DetailPanelButton, type SiteComment } from '$lib'
  import plusIcon from '@iconify-icons/ph/plus'
  import downloadIcon from '@iconify-icons/ph/download-simple'
  import { createEventDispatcher } from 'svelte'
  import { eq } from '@txstate-mws/svelte-components'
  import { DateTime } from 'luxon'

  export let headerColor: string
  export let comments: SiteComment[]
  export let mayAddComments: boolean
  const dispatch = createEventDispatcher()

  const auditPanelButtons: DetailPanelButton[] = []
  if (mayAddComments) auditPanelButtons.push({ icon: plusIcon, hiddenLabel: 'add comment', onClick: () => { dispatch('addauditcomment') } })
  auditPanelButtons.push({ icon: downloadIcon, hiddenLabel: 'Download Audit Log', onClick: () => { dispatch('downloadaudit') } })
</script>
<DetailPanel header="Audit" {headerColor} button={auditPanelButtons}>
  <DetailPanelSection>
    {#if comments.length}
      <ul use:eq>
        {#each comments as comment (comment.id)}
          <li class='comment-card'>
            <div>
              <span class="comment-text">{comment.comment}</span>
              <span class="comment-creator">{comment.createdBy.id}</span>
            </div>
            <span class="comment-date">{DateTime.fromISO(comment.createdAt).toFormat('LLL d, yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>
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
  li.comment-card .comment-creator {
    text-align: right;
  }
</style>
