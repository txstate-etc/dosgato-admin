<script lang="ts">
  import { FieldText, FieldCheckbox, FieldSelect, FieldMultiple, Icon, FieldChooserLink, Tabs, Tab } from '@dosgato/dialog'
  import { isNotBlank } from 'txstate-utils'
  export let data

  const choices = [
    { label: 'Inherit from parent page (default)', value: '' },
    { label: 'Don\'t send reminders', value: '999999' },
    { label: 'One year', value: '365' },
    { label: 'Six months', value: '183' },
    { label: 'Three months', value: '90' },
    { label: 'One month', value: '30' },
    { label: 'One week', value: '7' }
  ]

  const tabs = [
    { name: 'General' },
    { name: 'Advanced' },
    { name: 'Social' }
  ]
</script>
<Tabs {tabs}>
  <Tab name="General">
    <FieldText path="title" label="Title" />
    <FieldCheckbox path="hideTitle" boxLabel="Hide the page title"/>
    <FieldCheckbox path="hideInNav" boxLabel="Do not show this page in the navigation" label="Hide in Menu"/>
    <FieldCheckbox path="hideSidebar" label="Sidebar" boxLabel="Do not display the navigation sidebar"/>
    <FieldSelect path="currency" label="Update Reminder" choices={choices} notNull/>
  </Tab>
  <Tab name="Advanced">
    <FieldCheckbox path="enableRSS" label="Enable RSS Feed" boxLabel="Create RSS feed for this page."/>
    Password Protect Page (Custom Field)
    <!-- <FieldMultiple removable path="googleanalytics" label="Google Analytics">
      <FieldText path="" />
    </FieldMultiple> -->
  </Tab>
  <Tab name="Social">
    <div>
      If someone makes a social post about this page, the below details will be used for the post.</div>
      <FieldText path="socialtitle" label="Title" />
      <FieldChooserLink path="socialimage" label="Image" assets />
      <FieldText path="socialimagealt" label="Alt. Text" required conditional={isNotBlank(data.socialimage)}/>
      <FieldText path="socialdescription" label="Description"/>
  </Tab>
</Tabs>
