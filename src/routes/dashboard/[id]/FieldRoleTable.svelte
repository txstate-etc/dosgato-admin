<script lang="ts">
  import { Button, Checkbox, FieldStandard } from '@dosgato/dialog'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { randomid } from 'txstate-utils'
  import minusIcon from '@iconify-icons/ph/minus-circle-fill'

  export let path: string
  export let label: string
  export let auditRoles: { id: string, name: string, description?: string }[] = []
  export let helptext: string | undefined = undefined
  export let required = false
  export let conditional: boolean | undefined = undefined

  const descid = randomid()
  const assignheaderid = randomid()
  const tableid = randomid()

  $: roles = auditRoles.map(r => ({ ...r, labelid: `${tableid}-${r.id}-label`, checkboxid: `${tableid}-${r.id}-checkbox` }))

  function onToggle (roleId: string, value: string[] | undefined, setVal: (val: any) => void) {
    return function (this: HTMLInputElement) {
      const current = value ?? []
      setVal(this.checked ? [...current, roleId] : current.filter(id => id !== roleId))
    }
  }
</script>

<FieldStandard {path} {descid} {label} {helptext} {required} {conditional} defaultValue={[]} let:value let:setVal let:onBlur>
  <Button type="button" secondary class="role-table-remove-all" icon={minusIcon} disabled={!value?.length} on:click={() => setVal([])}>Remove all</Button>
  <table id={tableid} aria-labelledby={descid}>
    <thead>
      <tr>
        <th scope="col">Role</th>
        <th scope="col">Description</th>
        <th scope="col" id={assignheaderid}>Assign</th>
      </tr>
    </thead>
    <tbody>
      {#each roles as role (role.id)}
        <tr>
          <td id={role.labelid} data-label="Role">{role.name}</td>
          <td data-label="Description">{role.description ?? ''}</td>
          <td data-label="Assign">
            <label for={role.checkboxid}>
              <Checkbox
                id={role.checkboxid}
                name={path}
                value={!!value?.includes(role.id)}
                descid={role.labelid}
                onChange={onToggle(role.id, value, setVal)}
                {onBlur}
              />
              <ScreenReaderOnly>Assign {role.name}</ScreenReaderOnly>
            </label>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="3">No roles available.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</FieldStandard>

<style>
  :global(button.role-table-remove-all) {
    margin-bottom: 0.5em;
    margin-left: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  tr:has(th) {
    background-color: #ddd;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    height: 2.5em;
  }
  th {
    padding: 0;
  }
  td, th {
    padding-inline: 0.5em;
    text-align: left;
  }
  td[data-label="Assign"] {
    text-align: center;
  }
  td {
    padding-block: 0.5em;
    border-bottom: 1px dashed #767676;
  }
 </style>
