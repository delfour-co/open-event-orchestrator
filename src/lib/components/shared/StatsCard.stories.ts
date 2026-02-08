import type { Meta, StoryObj } from '@storybook/sveltekit'
import StatsCard from './StatsCard.svelte'

const meta = {
  title: 'Shared/StatsCard',
  component: StatsCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    value: { control: 'number' },
    description: { control: 'text' },
    format: {
      control: 'select',
      options: ['none', 'number', 'currency', 'percent']
    },
    currency: { control: 'text' }
  }
} satisfies Meta<StatsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Users',
    value: 1234
  }
}

export const WithNumber: Story = {
  args: {
    title: 'Total Orders',
    value: 15678,
    format: 'number'
  }
}

export const WithCurrency: Story = {
  args: {
    title: 'Revenue',
    value: 125000,
    format: 'currency',
    currency: 'EUR'
  }
}

export const WithPercent: Story = {
  args: {
    title: 'Conversion Rate',
    value: 12.5,
    format: 'percent'
  }
}

export const WithDescription: Story = {
  args: {
    title: 'Active Sessions',
    value: 42,
    description: 'In the last 24 hours'
  }
}

export const WithPositiveTrend: Story = {
  args: {
    title: 'Monthly Revenue',
    value: 45000,
    format: 'currency',
    currency: 'EUR',
    trend: { value: 12.5, label: 'vs last month' }
  }
}

export const WithNegativeTrend: Story = {
  args: {
    title: 'Bounce Rate',
    value: 35,
    format: 'percent',
    trend: { value: -5.2, label: 'improvement' }
  }
}
