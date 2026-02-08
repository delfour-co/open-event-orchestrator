import type { Meta, StoryObj } from '@storybook/sveltekit'
import StatusBadge from './StatusBadge.svelte'

const meta = {
  title: 'Shared/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'draft',
        'pending',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'confirmed',
        'declined',
        'withdrawn',
        'cancelled',
        'paid',
        'refunded',
        'used',
        'active',
        'inactive',
        'published',
        'archived'
      ]
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    label: { control: 'text' }
  }
} satisfies Meta<StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    status: 'pending'
  }
}

export const Submitted: Story = {
  args: {
    status: 'submitted'
  }
}

export const Accepted: Story = {
  args: {
    status: 'accepted'
  }
}

export const Rejected: Story = {
  args: {
    status: 'rejected'
  }
}

export const Paid: Story = {
  args: {
    status: 'paid'
  }
}

export const Small: Story = {
  args: {
    status: 'active',
    size: 'sm'
  }
}

export const Large: Story = {
  args: {
    status: 'published',
    size: 'lg'
  }
}

export const CustomLabel: Story = {
  args: {
    status: 'under_review',
    label: 'In Review'
  }
}
