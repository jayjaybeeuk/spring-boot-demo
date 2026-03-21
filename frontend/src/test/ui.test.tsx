import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

describe('Button', () => {
  it('renders a standard button', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders as a child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument()
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })
})

describe('Card sub-components', () => {
  it('renders CardDescription', () => {
    render(<CardDescription>A description</CardDescription>)
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('renders CardFooter', () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('renders a fully composed Card', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
