<script lang="ts">
  import { FieldMultiselect } from '@dosgato/dialog'
  import { uiConfig } from '../../local'

  export let trainings: { id: string, name: string, lcName: string }[]

  async function getOptions (search: string) {
    if (!search?.length) return trainings.map(t => ({ value: t.id, label: t.name }))
    const lcSearch = search.toLocaleLowerCase()
    return trainings.filter(t => t.lcName.includes(lcSearch) || t.id === lcSearch).map(t => ({ value: t.id, label: t.name }))
  }
</script>

{#if !uiConfig.trainings?.hide}
  <FieldMultiselect path='trainings' disabled={uiConfig.trainings?.noEdit} label='Training' helptext='Trainings the user has completed.' {getOptions} />
{/if}
