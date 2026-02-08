import type { Meta, StoryObj } from '@storybook/sveltekit'
import EmptyState from './EmptyState.svelte'

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' }
  }
} satisfies Meta<EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'Get started by creating a new item.'
  }
}

export const WithoutDescription: Story = {
  args: {
    title: 'No results'
  }
}

export const NoTalks: Story = {
  args: {
    title: 'No talks submitted yet',
    description: 'Speakers can submit their talks through the CFP form.'
  }
}

export const NoOrders: Story = {
  args: {
    title: 'No orders yet',
    description: 'Orders will appear here once attendees start purchasing tickets.'
  }
}
