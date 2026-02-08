import type { Meta, StoryObj } from '@storybook/sveltekit'
import Pagination from './Pagination.svelte'

const meta = {
  title: 'Shared/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    currentPage: { control: 'number' },
    totalPages: { control: 'number' },
    totalItems: { control: 'number' },
    perPage: { control: 'number' },
    showInfo: { control: 'boolean' }
  }
} satisfies Meta<Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    perPage: 10,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    totalItems: 100,
    perPage: 10,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    totalItems: 100,
    perPage: 10,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    totalItems: 25,
    perPage: 10,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}

export const ManyPages: Story = {
  args: {
    currentPage: 15,
    totalPages: 50,
    totalItems: 500,
    perPage: 10,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}

export const WithoutInfo: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    showInfo: false,
    onPageChange: (page: number) => console.log('Page:', page)
  }
}
