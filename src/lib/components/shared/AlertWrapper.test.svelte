<script lang="ts">
import Alert from './Alert.svelte'

type Props = {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  content: string
  dismissible?: boolean
  onDismiss?: () => void
}

const { variant = 'info', title, content, dismissible = false, onDismiss }: Props = $props()
</script>

<Alert {variant} {title} {dismissible} {onDismiss}>
  {#snippet children()}
    {content}
  {/snippet}
</Alert>
