# Map of UI Logging Implementation

<details><summary>routes/</summary>

* +layout.svelte
  * sets `screen` for all admin pages to `$page.route.id`
  * afterNavigate - logs all navigation events for all pages after the event
  * `setContext('LabeledIconButtonTarget', { getTarget: () => labeledIconButtonTarget.target })` - Currently just does this for the `"Profile-PopupMenu"` `LabeledIconButton` that's only displayed when the screen is narrow enough. This brings up a design question. Buttons could have static targets or dynamic targets. In this case it's static. A callback is used to make the `<LabeledIconButton>` component dynamic in what's targeted since other `<LabeledIconButton>` elements could be defined and their targets could be dependent on what's selected elsewhere on a page. We may want to say all `LabeledIconButton` have a static target that gets passed to them as a property of the svelete component rather than using a callback or define seperate callbacks as a property passed to each one rather than setting to a scopable `LabeledIconButtonTarget` context.
  * NavBar - `<LabeledIcon>` elements - Each determines target from the href value associated with them.
  * profile - button element - on:click inlined call to log with `'Login-PopupMenu'` as a static target.

* <details><summary>assets/</summary>

  * +page.svelte
    * `setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })` - `actionPanelTarget.target` gets reactively defined as whatever's selected in the Assets tree $store.
    * `modalContext` - passed a function to fetch the same target as the `actionPanelTarget.target` for it's UI Logging target.
    * We may want to update how the actionPanelTarget.target is reactively assigned from the Assets tree $store as it's currently using the `uiLog.targetFromTreeStore` function on `'path'` as the property. If multiple items are selected their value is replaced with the litteral string `'multiple'`.
    * This is an instance of `target` pointing to a component or item in a page rather than where the user's focus will be after interactions are processed.

  * <details><summary>[id]/</summary>

    * +page.svelte
      * `modalContext` - Each time the modal's context is set the associated Asset's path is passed as the target to use for UI Logging.
      * This is an instance of `target` pointing to a component or item in a page rather than where the user's focus will be after interactions are processed.

    </details>
  </details>
* <details><summary>auth/</summary>

  * <details><summary>groups/</summary>

    * +page.svelte
      * `setContext('ActionPanelTarget', { getTarget: () => uiLog.targetFromTreeStore($store, 'id') })` - Here whatever `id` is selected in the groups tree $store is the `target` logged for ActionPanel interactions.
      * `modalContext` - On this one it's passed a function to determine target where it will prioritize any `targetDescriptor` currently defined in the $modalContext store else default to the `actionPanelTarget.target`. This is necessary for when nothing is selected in the groups tree $store and the 'Add Group' action is clicked.
      * This is an instance of `target` _sometimes_ pointing to a component or item in a page rather than where the user's focus will be after interactions are processed.

    * <details><summary>[id]/</summary>

      * +page.svelte
        * ???
        * ???

      </details>
    </details>
  * <details><summary>roles/</summary>

    * +page.svelte
      * ???
      * ???

    * <details><summary>[id]/</summary>

      * +page.svelte
        * ???
        * ???

      </details>
    </details>
  * <details><summary>system/</summary>

    * +page.svelte
      * ???
      * ???

    </details>
  * <details><summary>users/</summary>

    * +page.svelte
      * ???
      * ???

    * <details><summary>[id]/</summary>

      * +page.svelte
        * ???
        * ???

      </details>
    </details>

  </details>
* <details><summary>data/</summary>

  * +page.svelte
    * ???
    * ???

  * <details><summary>[id]/</summary>

    * +page.svelte
      * ???
      * ???

    </details>
  </details>
* <details><summary>pages/</summary>

  * +page.svelte
    * ???
    * ???

  * <details><summary>[id]/</summary>

    * +page.svelte
      * ???
      * ???

    </details>
  </details>
* <details><summary>settings/</summary>

  * <details><summary>templates/</summary>

    * +page.svelte
      * ???
      * ???

    </details>
  </details>
* <details><summary>sites/</summary>

  * +page.svelte
    * ???
    * ???

  * <details><summary>[id]/</summary>

    * +page.svelte
      * ???
      * ???

    </details>
  </details>

</details>
