<script>
  import { FieldText, Tabs, Tab } from '@dosgato/dialog'

  const tabs = [
    { name: 'General' },
    { name: 'Other' }
  ]
</script>

<Tabs {tabs}>
  <Tab name="General">
    <FieldText path="author" label="Author" />
    <FieldText path="quote" label="Quote" />
  </Tab>
  <Tab name="Other">
    Nothing to see here.
  </Tab>
</Tabs>
