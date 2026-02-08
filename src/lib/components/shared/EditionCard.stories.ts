import type { Meta, StoryObj } from '@storybook/sveltekit'
import EditionCard from './EditionCard.svelte'

const meta = {
  title: 'Shared/EditionCard',
  component: EditionCard,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' }
  }
} satisfies Meta<EditionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    edition: {
      id: '1',
      name: 'DevFest 2024',
      slug: 'devfest-2024',
      year: 2024,
      status: 'published'
    }
  }
}

export const WithDates: Story = {
  args: {
    edition: {
      id: '2',
      name: 'Tech Conference 2024',
      slug: 'tech-conf-2024',
      status: 'draft',
      startDate: '2024-06-15',
      endDate: '2024-06-17'
    }
  }
}

export const Selected: Story = {
  args: {
    edition: {
      id: '3',
      name: 'Code Summit 2024',
      slug: 'code-summit-2024',
      year: 2024,
      status: 'active'
    },
    selected: true
  }
}

export const WithLink: Story = {
  args: {
    edition: {
      id: '4',
      name: 'React Conf 2024',
      slug: 'react-conf-2024',
      status: 'published',
      startDate: '2024-09-20',
      endDate: '2024-09-22'
    },
    href: '/admin/editions/react-conf-2024'
  }
}

export const Draft: Story = {
  args: {
    edition: {
      id: '5',
      name: 'Upcoming Event',
      slug: 'upcoming-event',
      year: 2025,
      status: 'draft'
    }
  }
}

export const Archived: Story = {
  args: {
    edition: {
      id: '6',
      name: 'Past Conference 2023',
      slug: 'past-conf-2023',
      year: 2023,
      status: 'archived'
    }
  }
}
