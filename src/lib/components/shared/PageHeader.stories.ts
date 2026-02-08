// @ts-nocheck - Storybook types incompatible with Svelte 5 component types
import type { Meta, StoryObj } from '@storybook/sveltekit'
import PageHeader from './PageHeader.svelte'

const meta: Meta = {
  title: 'Shared/PageHeader',
  component: PageHeader as object,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Dashboard'
  }
}

export const WithDescription: Story = {
  args: {
    title: 'Talks',
    description: 'Manage and review submitted talks for your event.'
  }
}

export const LongTitle: Story = {
  args: {
    title: 'Conference Management Dashboard',
    description:
      'View and manage all aspects of your conference including speakers, talks, and attendees.'
  }
}
