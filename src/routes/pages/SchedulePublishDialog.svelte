<script lang="ts">
  import { FieldCheckbox, FieldDateTime, FieldHidden, FieldSelect, FormDialog, FormPreamble } from '@dosgato/dialog'
  import type { Feedback, SubmitResponse } from '@txstate-mws/svelte-forms'
  import { onMount } from 'svelte'
  import { unique } from 'txstate-utils'
  import { api, type ScheduledPublish, ScheduledPublishAction, ScheduledPublishStatus, ScheduledPublishRecurrenceType } from '$lib'

  export let page: { id: string, permissions: { schedulePublish: boolean, scheduleUnpublish: boolean } }

  let existingPublishSchedule: ScheduledPublish | undefined
  let existingUnpublishSchedule: ScheduledPublish | undefined
  let canPublish = false
  let canUnpublish = false
  let loading = true
  let preload: SchedulePublishState | undefined

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

  onMount(async () => {
    const schedules = await api.getScheduledPublishes([page.id], [ScheduledPublishStatus.PENDING])
    existingPublishSchedule = schedules.find(s => s.action === ScheduledPublishAction.PUBLISH || s.action === ScheduledPublishAction.PUBLISH_WITH_SUBPAGES)
    existingUnpublishSchedule = schedules.find(s => s.action === ScheduledPublishAction.UNPUBLISH)

    canPublish = page.permissions.schedulePublish || !!existingPublishSchedule?.permissions.edit
    canUnpublish = page.permissions.scheduleUnpublish || !!existingUnpublishSchedule?.permissions.edit
    const existingRecurrence = existingPublishSchedule?.recurrence ?? existingUnpublishSchedule?.recurrence

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
    preload={preload}
    on:escape
    on:saved
    let:data>
    <FormPreamble>If the team member who scheduled a page to be published is removed or otherwise loses access to the site, the publish will be cancelled. If you hit Save, you become the scheduler.</FormPreamble>
    <FieldDateTime clearable path='publishDate' label='Publish Date' conditional={canPublish} helptext={data.publishDate ? 'To remove this scheduled publish, clear this field and hit Save.' : 'The page will be published on the scheduled date and time.'}/>
    <FieldCheckbox path='includeSubpages' related boxLabel='Include subpages in scheduled publish' conditional={canPublish && !!data.publishDate} />
    <FieldCheckbox path='hasRecurrence' related boxLabel='Repeat publish on a schedule' conditional={(canPublish && !!data.publishDate) || (canUnpublish && !!data.unpublishDate)} defaultValue={false} />
    <FieldHidden path='recurrenceType' conditional={!!data.hasRecurrence} value={ScheduledPublishRecurrenceType.WEEK} />
    <FieldSelect path='recurrenceInterval' related number label='Repeat' choices={recurrenceChoices} conditional={!!data.hasRecurrence} notNull defaultValue={1} />
    <FieldDateTime clearable path='unpublishDate' label='Unpublish Date' conditional={canUnpublish} helptext={data.unpublishDate ? 'To remove this scheduled unpublish, clear this field and hit Save.' : 'The page and its subpages will be unpublished on the selected date and time.'} />
  </FormDialog>
{/if}
