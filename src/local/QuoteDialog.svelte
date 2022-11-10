<script>
  import { FieldText, Tabs, Tab } from '@dosgato/dialog'

  const tabs = [
    { title: 'General' },
    { title: 'Other' }
  ]
</script>

<Tabs {tabs}>
  <Tab title="General">
    <FieldText path="author" label="Author" />
    <FieldText path="quote" label="Quote" />
  </Tab>
  <Tab title="Other">
    Nothing to see here.
  </Tab>
</Tabs>
