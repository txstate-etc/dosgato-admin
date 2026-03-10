<script lang="ts">
  import { Dialog, Tooltip } from '@dosgato/dialog'
  import { onMount } from 'svelte'
  import { api, dateStamp, ScheduledPublishStatus, ScheduledPublishAction, confirmationStore } from '$lib'
  import type { ScheduledPublish } from '$lib'

  export let pageId: string

  let schedules: ScheduledPublish[] = []
  let loading = true
  let currentPage = 0
  const pageSize = 15

  $: reversed = schedules.toReversed()
  $: totalPages = Math.max(1, Math.ceil(reversed.length / pageSize))
  $: pagedSchedules = reversed.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  onMount(async () => {
    schedules = await api.getScheduledPublishes([pageId], [ScheduledPublishStatus.PENDING, ScheduledPublishStatus.COMPLETED, ScheduledPublishStatus.FAILED, ScheduledPublishStatus.CANCELLED])
    loading = false
  })

  function cancelSchedule (schedule: ScheduledPublish) {
    return async () => {
      if (!await confirmationStore.confirm(`Are you sure you want to cancel this scheduled ${schedule.action === ScheduledPublishAction.PUBLISH || schedule.action === ScheduledPublishAction.PUBLISH_WITH_SUBPAGES ? 'publish' : 'unpublish'}?`)) {
        return
      }
      const resp = await api.cancelScheduledPublish(schedule.id)
      if (resp.success) {
        schedules = schedules.map(s => s.id === schedule.id ? resp.data : s)
      }
    }
  }

  function formatAction (action: ScheduledPublishAction) {
    return {
      [ScheduledPublishAction.PUBLISH]: 'Publish',
      [ScheduledPublishAction.PUBLISH_WITH_SUBPAGES]: 'Publish w/ Subpages',
      [ScheduledPublishAction.UNPUBLISH]: 'Unpublish'
    }[action]
  }
</script>

<Dialog title="Schedule History" continueText="" cancelText="Close" size="large" on:escape>
  {#if loading}
    <p>Loading...</p>
  {:else if schedules.length === 0}
    <p>No scheduled publishes found for this page.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Target Date</th>
          <th>Status</th>
          <th>Scheduled At</th>
          <th>By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each pagedSchedules as schedule (schedule.id)}
          <tr class="status-{schedule.status.toLowerCase()}">
            <td>{formatAction(schedule.action)}</td>
            <td>{dateStamp(schedule.targetDate)}</td>
            <td>
              {#if schedule.error}
                <Tooltip tip={schedule.error} bottom>
                  <span class="status-badge {schedule.status.toLowerCase()}">{schedule.status}</span>
                </Tooltip>
              {:else}
                <span class="status-badge {schedule.status.toLowerCase()}">{schedule.status}</span>
              {/if}
            </td>
            <td>{dateStamp(schedule.updatedAt)}</td>
            <td>{schedule.updatedByUser.name}</td>
            <td>
              {#if schedule.status === ScheduledPublishStatus.PENDING && schedule.permissions.cancel}
                <button type="button" class="cancel-btn" on:click={cancelSchedule(schedule)}>Cancel</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if totalPages > 1}
      <div class="pagination">
        <button type="button" disabled={currentPage === 0} on:click={() => { currentPage-- }}>Previous</button>
        <span>Page {currentPage + 1} of {totalPages}</span>
        <button type="button" disabled={currentPage >= totalPages - 1} on:click={() => { currentPage++ }}>Next</button>
      </div>
    {/if}
  {/if}
</Dialog>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }
  th, td {
    text-align: left;
    padding: 0.4em 0.6em;
    border-bottom: 1px solid #ddd;
  }
  th {
    font-weight: 600;
    border-bottom: 2px solid #999;
  }
  .status-badge {
    padding: 0.15em 4px;
    border-radius: 3px;
    font-size: 0.85em;
    font-weight: 500;
  }
  .status-badge.pending {
    background-color: #e6f4ea;
    color: #1e7e34;
  }
  .status-badge.completed {
    background-color: #e3f2fd;
    color: #1565c0;
  }
  .status-badge.failed {
    background-color: #fdecea;
    color: #c62828;
  }
  .status-badge.cancelled {
    background-color: #eeeeee;
    color: #616161;
  }
  .cancel-btn {
    cursor: pointer;
    padding: 0.2em 0.6em;
    border: 1px solid #c62828;
    border-radius: 3px;
    background: #fff;
    color: #c62828;
    font-size: 0.85em;
  }
  .cancel-btn:hover {
    background: #fdecea;
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1em;
    margin-top: 1em;
  }
  .pagination button {
    cursor: pointer;
    padding: 0.3em 0.8em;
    border: 1px solid #999;
    border-radius: 3px;
    background: #f5f5f5;
  }
  .pagination button:disabled {
    cursor: default;
    opacity: 0.5;
  }
</style>
