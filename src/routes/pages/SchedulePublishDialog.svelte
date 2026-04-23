<script lang="ts">
  import { Button, FieldCheckbox, FieldDateTime, FieldHidden, FieldSelect, FormDialog, FormPreamble, Tab, Tabs, Tooltip } from '@dosgato/dialog'
  import type { Feedback, SubmitResponse } from '@txstate-mws/svelte-forms'
  import { DateTime } from 'luxon'
  import { onMount } from 'svelte'
  import { unique } from 'txstate-utils'
  import { api, dateStamp, type ScheduledPublish, ScheduledPublishAction, ScheduledPublishStatus, ScheduledPublishRecurrenceType, toast } from '$lib'
    import DismissableWarning from '$lib/components/DismissableWarning.svelte';

  export let page: { id: string, permissions: { schedulePublish: boolean, scheduleUnpublish: boolean } }

  let existingPublishSchedule: ScheduledPublish | undefined
  let existingUnpublishSchedule: ScheduledPublish | undefined
  let canPublish = false
  let canUnpublish = false
  let loading = true
  let preload: SchedulePublishState | undefined
  let showPermissionWarning = false
  let historySchedules: ScheduledPublish[] | undefined
  let currentPage = 1
  let finalPage = 1
  const perPage = 20

  const tabs = [
    { name: 'General' },
    { name: 'History' }
  ]

  interface SchedulePublishState {
    publishDate: string | null
    includeSubpages: boolean
    unpublishDate: string | null
    hasRecurrence: boolean
    recurrenceType: ScheduledPublishRecurrenceType
    recurrenceInterval: number
  }

  const recurrenceChoices = [
    { label: 'Every Week', value: 1 },
    { label: 'Every Two Weeks', value: 2 },
    { label: 'Every Four Weeks', value: 4 }
  ]

  function buildRecurrence (state: SchedulePublishState) {
    if (!state.hasRecurrence) return undefined
    return {
      type: state.recurrenceType,
      interval: state.recurrenceInterval,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  function formatAction (action: ScheduledPublishAction) {
    return {
      [ScheduledPublishAction.PUBLISH]: 'Publish',
      [ScheduledPublishAction.PUBLISH_WITH_SUBPAGES]: 'Publish w/ Subpages',
      [ScheduledPublishAction.UNPUBLISH]: 'Unpublish'
    }[action]
  }

  function onSaved (e: CustomEvent<SchedulePublishState>) {
    if (!e.detail.publishDate) return
    const dt = DateTime.fromJSDate(new Date(e.detail.publishDate))
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    toast(`Scheduled to publish on ${dateStamp(dt)} (${tz}).`, 'success')
  }

  async function loadHistory (p: number) {
    historySchedules = undefined
    currentPage = p
    const resp = await api.getScheduledPublishes([page.id], [ScheduledPublishStatus.PENDING, ScheduledPublishStatus.COMPLETED, ScheduledPublishStatus.FAILED, ScheduledPublishStatus.CANCELLED], { page: p, perPage })
    historySchedules = resp.scheduledPublishes
    finalPage = resp.finalPage
  }

  onMount(async () => {
    const { scheduledPublishes: pending } = await api.getScheduledPublishes([page.id], [ScheduledPublishStatus.PENDING])
    void loadHistory(1)

    existingPublishSchedule = pending.find(s => s.action === ScheduledPublishAction.PUBLISH || s.action === ScheduledPublishAction.PUBLISH_WITH_SUBPAGES)
    existingUnpublishSchedule = pending.find(s => s.action === ScheduledPublishAction.UNPUBLISH)

    canPublish = page.permissions.schedulePublish || !!existingPublishSchedule?.permissions.edit
    canUnpublish = page.permissions.scheduleUnpublish || !!existingUnpublishSchedule?.permissions.edit
    const existingRecurrence = existingPublishSchedule?.recurrence ?? existingUnpublishSchedule?.recurrence
    showPermissionWarning = !!existingPublishSchedule?.actionNotPermitted || !!existingUnpublishSchedule?.actionNotPermitted
    preload = {
      publishDate: existingPublishSchedule?.targetDate ?? null,
      includeSubpages: existingPublishSchedule?.action === ScheduledPublishAction.PUBLISH_WITH_SUBPAGES,
      unpublishDate: existingUnpublishSchedule?.targetDate ?? null,
      hasRecurrence: !!existingRecurrence,
      recurrenceType: existingRecurrence?.type ?? ScheduledPublishRecurrenceType.DAY,
      recurrenceInterval: existingRecurrence?.interval ?? 1
    }
    loading = false
  })

  async function validate (state: SchedulePublishState) {
    const messages: Feedback[] = []

    if (state.publishDate) {
      const action: ScheduledPublishAction = state.includeSubpages ? ScheduledPublishAction.PUBLISH_WITH_SUBPAGES : ScheduledPublishAction.PUBLISH
      const recurrence = buildRecurrence(state)
      if (existingPublishSchedule) {
        const resp = await api.updateScheduledPublish(existingPublishSchedule.id, { action, targetDate: state.publishDate, recurrence }, true)
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'publishDate' : m.path === 'recurrence.interval' ? 'recurrenceInterval' : m.path })))
      } else {
        const resp = await api.createScheduledPublish({ pageId: page.id, action, targetDate: state.publishDate, recurrence }, true)
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'publishDate' : m.path === 'recurrence.interval' ? 'recurrenceInterval' : m.path })))
      }
    }

    if (state.unpublishDate) {
      const action: ScheduledPublishAction = ScheduledPublishAction.UNPUBLISH
      const recurrence = buildRecurrence(state)
      if (existingUnpublishSchedule) {
        const resp = await api.updateScheduledPublish(existingUnpublishSchedule.id, { action, targetDate: state.unpublishDate, recurrence }, true)
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'unpublishDate' : m.path === 'recurrence.interval' ? 'recurrenceInterval' : m.path })))
      } else {
        const resp = await api.createScheduledPublish({ pageId: page.id, action: ScheduledPublishAction.UNPUBLISH, targetDate: state.unpublishDate, recurrence }, true)
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'unpublishDate' : m.path === 'recurrence.interval' ? 'recurrenceInterval' : m.path })))
      }
    }

    return unique(messages, m => `${m.path}-${m.type}-${m.message}`)
  }

  async function submit (state: SchedulePublishState): Promise<SubmitResponse<SchedulePublishState>> {
    const messages: Feedback[] = []
    let allSuccess = true
    const recurrence = buildRecurrence(state)

    // Handle publish schedule
    if (state.publishDate) {
      const action: ScheduledPublishAction = state.includeSubpages ? ScheduledPublishAction.PUBLISH_WITH_SUBPAGES : ScheduledPublishAction.PUBLISH
      if (existingPublishSchedule) {
        const resp = await api.updateScheduledPublish(existingPublishSchedule.id, { action, targetDate: state.publishDate, recurrence })
        if (!resp.success) allSuccess = false
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'publishDate' : m.path })))
      } else {
        let resp = await api.createScheduledPublish({ pageId: page.id, action, targetDate: state.publishDate, recurrence })
        // If create fails because schedule already exists, retry as update
        if (!resp.success && resp.data?.id) {
          resp = await api.updateScheduledPublish(resp.data.id, { action, targetDate: state.publishDate, recurrence })
        }
        if (!resp.success) allSuccess = false
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'publishDate' : m.path })))
      }
    } else if (existingPublishSchedule) {
      const resp = await api.cancelScheduledPublish(existingPublishSchedule.id)
      if (!resp.success) allSuccess = false
      messages.push(...resp.messages)
    }

    // Handle unpublish schedule
    if (state.unpublishDate) {
      const action = ScheduledPublishAction.UNPUBLISH
      if (existingUnpublishSchedule) {
        const resp = await api.updateScheduledPublish(existingUnpublishSchedule.id, { action, targetDate: state.unpublishDate })
        if (!resp.success) allSuccess = false
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'unpublishDate' : m.path })))
      } else {
        let resp = await api.createScheduledPublish({ pageId: page.id, action: ScheduledPublishAction.UNPUBLISH, targetDate: state.unpublishDate })
        if (!resp.success && resp.data?.id) {
          resp = await api.updateScheduledPublish(resp.data.id, { action, targetDate: state.unpublishDate })
        }
        if (!resp.success) allSuccess = false
        messages.push(...resp.messages.map(m => ({ ...m, path: m.path === 'targetDate' ? 'unpublishDate' : m.path })))
      }
    } else if (existingUnpublishSchedule) {
      const resp = await api.cancelScheduledPublish(existingUnpublishSchedule.id)
      if (!resp.success) allSuccess = false
      messages.push(...resp.messages)
    }

    return {
      success: allSuccess,
      messages: unique(messages, m => `${m.path}-${m.type}-${m.message}`),
      data: state
    }
  }
</script>

{#if !loading && preload}
  <FormDialog
    {submit}
    {validate}
    title='Schedule Publish/Unpublish'
    size='normal'
    preload={preload}
    on:escape
    on:saved
    on:saved={onSaved}
    let:data>
    <Tabs {tabs}>
      <Tab name="General">
        <FormPreamble>If the team member scheduling this page to be published is removed or otherwise loses access to the Gato site, the scheduled action will not occur.<br><br>
        To remove a previously scheduled publish, clear the related date and time field, then save this window.</FormPreamble>
        <DismissableWarning message="The scheduled publish or unpublish will not occur without an account to own the action. Reactivate the scheduled action(s) by saving the window. To remove the scheduled action entirely, clear the field and save the window." open={showPermissionWarning} dismissable={false} />
        <FieldDateTime clearable path='publishDate' label='Publish Date' conditional={canPublish} helptext="Time automatically adjusts to your browser's timezone ({DateTime.local().toFormat('ZZZZ')})."/>
        <FieldCheckbox path='includeSubpages' related boxLabel='Include all subpages in scheduled publish' conditional={canPublish && !!data.publishDate} />
        <FieldCheckbox path='hasRecurrence' related boxLabel='Set recurring publish' conditional={(canPublish && !!data.publishDate) || (canUnpublish && !!data.unpublishDate)} defaultValue={false} />
        <FieldHidden path='recurrenceType' conditional={!!data.hasRecurrence} value={ScheduledPublishRecurrenceType.WEEK} />
        <FieldSelect path='recurrenceInterval' related number label='Repeat' choices={recurrenceChoices} conditional={!!data.hasRecurrence} notNull defaultValue={1} />
        <FieldDateTime clearable path='unpublishDate' label='Unpublish Date' conditional={canUnpublish} helptext="The page and its subpages will be unpublished on the selected date and time." />
      </Tab>
      <Tab name="History">
        {#if historySchedules == null}
          <p>Loading...</p>
        {:else if historySchedules.length === 0}
          <p>No scheduled publishes found for this page.</p>
        {:else}
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Date</th>
                <th>Status</th>
                <th>Modified</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {#each historySchedules as schedule (schedule.id)}
                <tr class="status-{schedule.status.toLowerCase()}">
                  <td>{formatAction(schedule.action)}</td>
                  <td>{dateStamp(schedule.targetDate, { includeTz: true })}</td>
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
                </tr>
              {/each}
            </tbody>
          </table>
          {#if finalPage > 1}
            <div class="pagination">
              <Button compact secondary disabled={currentPage <= 1} on:click={() => loadHistory(currentPage - 1)}>Previous</Button>
              <span>Page {currentPage} of {finalPage}</span>
              <Button compact secondary disabled={currentPage >= finalPage} on:click={() => loadHistory(currentPage + 1)}>Next</Button>
            </div>
          {/if}
        {/if}
      </Tab>
    </Tabs>
  </FormDialog>
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }
  th, td {
    text-align: left;
    padding: 0.6em 5px;
  }
  tr {
    background-image: linear-gradient(to right, #666 50%, transparent 0);
    background-position: bottom;
    background-repeat: repeat-x;
    background-size: 8px 1px;
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
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1em;
    margin-top: 1em;
  }
</style>
