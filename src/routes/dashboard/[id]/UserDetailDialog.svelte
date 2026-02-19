<script lang="ts">
  import { dateStamp, SortableTable, type DashboardSiteTeamMemberWithRole } from '$lib';
  import { Dialog } from '@dosgato/dialog'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let siteName: string
  export let userDetail: DashboardSiteTeamMemberWithRole | null = null
</script>

<Dialog title="View Team Member" continueText="Dismiss" on:continue={() => dispatch('dismiss')}>
  <div class="user-detail-modal-content">
    <section aria-labelledby="user-detail-site">
      <h2 id="user-detail-site">Site</h2>
      <p>{siteName}</p>
    </section>
    <div class="divider"></div>
    <section aria-labelledby="user-detail-user">
      <h2 class="no-desc" id="user-detail-user">User Details</h2>
      <div class="details">
        <div class="user-detail">
          <div class="label">Name</div>
          <div class="value">{userDetail?.name}</div>
        </div>
        <div class="user-detail">
          <div class="label">Username</div>
          <div class="value">{userDetail?.id}</div>
        </div>
        <div class="user-detail">
          <div class="label">Last Login</div>
          <div class="value">{userDetail?.lastlogin ? dateStamp(userDetail.lastlogin) : 'Never'}</div>
        </div>
        <div class="user-detail">
          <div class="label">Current Access Level(s)</div>
          <div class="value">{userDetail?.access}</div>
        </div>
      </div>
    </section>
    <div class="divider"></div>
    <section aria-labelledby="user-detail-roles">
      <h2 id="user-detail-roles">Assigned Role(s)</h2>
      <p class="help">Determines what actions and content this team member has access to.</p>
      {#if userDetail?.roles?.length}
        <SortableTable items={userDetail.roles} headers={[
          { id: 'role', label: 'Role', get: 'name' },
          { id: 'description', label: 'Description', get: 'description' }
        ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
      {:else}
        <p>No roles assigned.</p>
      {/if}
    </section>
  </div>
</Dialog>

<style>
  .user-detail-modal-content section {
    margin-bottom: 1em;
  }
  .user-detail-modal-content section .details {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .user-detail-modal-content h2 {
    font-weight: 600;
    font-size: 1em;
    margin: 0;
  }
  .user-detail-modal-content h2.no-desc {
    margin-bottom: 1em;
  }
  .user-detail-modal-content p {
    margin: 0;
  }
  .user-detail-modal-content p.help {
    margin-bottom: 1em;
  }
  .user-detail-modal-content .divider {
    width: 100%;
    height: 1px;
    background-color: #ccced1;
    margin-bottom: 1em;
  }
  .user-detail-modal-content .user-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .user-detail-modal-content .user-detail .label {
    font-weight: 600;
    font-size: .75em;
    text-transform: uppercase;
  }
</style>
