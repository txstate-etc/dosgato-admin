<script>
  import { FieldText, FieldCheckbox, FieldSelect } from '@dosgato/dialog'

  const choices = [
    { label: 'Inherit from parent page (default)', value: '' },
    { label: 'Don\'t send reminders', value: 999999 },
    { label: 'One year', value: 365 },
    { label: 'Six months', value: 183 },
    { label: 'Three months', value: 90 },
    { label: 'One month', value: 30 },
    { label: 'One week', value: 7 }
  ]
</script>

<FieldText path="title" label="Title" />
<FieldCheckbox path="hideTitle" boxLabel="Hide the page title"/>
<FieldCheckbox path="hideInNav" boxLabel="Do not show this page in the navigation" label="Hide in Menu"/>
<FieldCheckbox path="hideSidebar" label="Sidebar" boxLabel="Do not display the navigation sidebar"/>
<FieldSelect path="currency" label="Update Reminder" choices={choices}/>