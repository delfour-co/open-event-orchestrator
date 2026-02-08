import type { Meta, StoryObj } from '@storybook/sveltekit'
import SearchInput from './SearchInput.svelte'

const meta = {
  title: 'Shared/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    loading: { control: 'boolean' },
    debounceMs: { control: 'number' }
  }
} satisfies Meta<SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Search...'
  }
}

export const WithValue: Story = {
  args: {
    value: 'John Doe',
    placeholder: 'Search users...'
  }
}

export const Loading: Story = {
  args: {
    value: 'searching',
    loading: true,
    placeholder: 'Search...'
  }
}

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Search talks by title or speaker...'
  }
}

export const WithCallback: Story = {
  args: {
    placeholder: 'Type to search (check console)...',
    onSearch: (value: string) => console.log('Searching:', value)
  }
}
