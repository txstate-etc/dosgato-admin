<script lang="ts">
  import { FieldText, FieldCheckbox, FieldSelect, FieldMultiple, Icon, FieldChooserLink } from '@dosgato/dialog'
  import { isNotBlank, randomid } from 'txstate-utils'
  import chevronRightIcon from '@iconify-icons/mdi/chevron-right'
  import chevronDownIcon from '@iconify-icons/mdi/chevron-down'
  export let data

  let showAdvanced: boolean = false
  const advancedFieldsId: string = randomid()
  let showSharing: boolean = false
  const sharingFieldsId: string = randomid()

  const choices = [
    { label: 'Inherit from parent page (default)', value: '' },
    { label: 'Don\'t send reminders', value: '999999' },
    { label: 'One year', value: '365' },
    { label: 'Six months', value: '183' },
    { label: 'Three months', value: '90' },
    { label: 'One month', value: '30' },
    { label: 'One week', value: '7' }
  ]
</script>
<div class="section-label">General Page Properties</div>
<FieldText path="title" label="Title" />
<FieldCheckbox path="hideTitle" boxLabel="Hide the page title"/>
<FieldCheckbox path="hideInNav" boxLabel="Do not show this page in the navigation" label="Hide in Menu"/>
<FieldCheckbox path="hideSidebar" label="Sidebar" boxLabel="Do not display the navigation sidebar"/>
<FieldSelect path="currency" label="Update Reminder" choices={choices} notNull/>
<div class="advanced-options dialog-area">
  <div class="header">
    <button type="button" on:click={() => { showAdvanced = !showAdvanced }} aria-expanded={showAdvanced} aria-controls={advancedFieldsId}>
      <Icon icon={showAdvanced ? chevronDownIcon : chevronRightIcon}/>
      {showAdvanced ? 'Hide' : 'Show'} Advanced Page Properties
    </button>
  </div>
  <div id={advancedFieldsId} class="body" class:show={showAdvanced}>
    <FieldCheckbox path="enableRSS" label="Enable RSS Feed" boxLabel="Create RSS feed for this page."/>
    Password Protect Page (Custom Field)
    <!-- <FieldMultiple removable path="googleanalytics" label="Google Analytics">
      <FieldText path="" />
    </FieldMultiple> -->
  </div>
</div>
<div class="sharing-options dialog-area">
  <div class="header">
    <button type="button" on:click={() => { showSharing = !showSharing }} aria-expanded={showSharing} aria-controls={sharingFieldsId}>
      <Icon icon={showSharing ? chevronDownIcon : chevronRightIcon}/>
      {showSharing ? 'Hide' : 'Show'} Social Sharing Options
    </button>
  </div>
  <div id={sharingFieldsId} class="body" class:show={showSharing}>
    <div>If someone makes a social post about this page, the below details will be used for the post.</div>
      <FieldText path="socialtitle" label="Title" />
      <FieldChooserLink path="socialimage" label="Image" assets />
      <FieldText path="socialimagealt" label="Alt. Text" required conditional={isNotBlank(data?.socialimage)}/>
      <FieldText path="socialdescription" label="Description"/>
  </div>
</div>


<style>
  .section-label {
    font-weight: bold
  }
  .dialog-area .body{
    display: none;
  }
  .dialog-area .body.show {
    display: block;
  }
  .dialog-area button {
    background-color: transparent;
    border: 0px;
    font-weight: bold;
  }
</style>
