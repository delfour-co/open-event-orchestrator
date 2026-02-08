<script context="module" lang="ts">
import { defineMeta } from '@storybook/addon-svelte-csf'
import Alert from './Alert.svelte'

const { Story } = defineMeta({
  title: 'Shared/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info']
    },
    title: { control: 'text' },
    dismissible: { control: 'boolean' }
  }
})
</script>

<Story name="Success" args={{ variant: 'success', title: 'Success!' }}>
  {#snippet children()}
    Your changes have been saved successfully.
  {/snippet}
</Story>

<Story name="Error" args={{ variant: 'error', title: 'Error' }}>
  {#snippet children()}
    Something went wrong. Please try again.
  {/snippet}
</Story>

<Story name="Warning" args={{ variant: 'warning', title: 'Warning' }}>
  {#snippet children()}
    This action cannot be undone.
  {/snippet}
</Story>

<Story name="Info" args={{ variant: 'info', title: 'Information' }}>
  {#snippet children()}
    A new version is available.
  {/snippet}
</Story>

<Story name="WithoutTitle" args={{ variant: 'info' }}>
  {#snippet children()}
    This is an informational message without a title.
  {/snippet}
</Story>

<Story
  name="Dismissible"
  args={{
    variant: 'success',
    title: 'Dismissible Alert',
    dismissible: true,
    onDismiss: () => alert('Dismissed!')
  }}
>
  {#snippet children()}
    Click the X to dismiss this alert.
  {/snippet}
</Story>
