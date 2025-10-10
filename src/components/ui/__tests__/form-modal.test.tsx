import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { FormModal } from '../form-modal'
import { z } from 'zod'

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type TestData = z.infer<typeof testSchema>

const TestComponent = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const handleSubmit = async (data: TestData) => {
    // Mock async submission
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('Submitted:', data)
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Form"
      schema={testSchema}
      onSubmit={handleSubmit}
      defaultValues={{ name: '', email: '' }}
    >
      {(form) => (
        <>
          <div>
            <label htmlFor="name" className="form-label">Name *</label>
            <input
              {...form.register('name')}
              id="name"
              type="text"
              className="form-input"
              aria-invalid={form.formState.errors.name ? 'true' : 'false'}
            />
            {form.formState.errors.name && (
              <p className="form-error" role="alert">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              {...form.register('email')}
              id="email"
              type="email"
              className="form-input"
              aria-invalid={form.formState.errors.email ? 'true' : 'false'}
            />
            {form.formState.errors.email && (
              <p className="form-error" role="alert">{form.formState.errors.email.message}</p>
            )}
          </div>
        </>
      )}
    </FormModal>
  )
}

describe('FormModal', () => {
  it('renders when open', () => {
    render(<TestComponent isOpen={true} onClose={() => {}} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Form')).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Email *')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<TestComponent isOpen={false} onClose={() => {}} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows validation errors', async () => {
    render(<TestComponent isOpen={true} onClose={() => {}} />)
    
    const submitButton = screen.getByText('Submit')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<TestComponent isOpen={true} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on close button click', () => {
    const onClose = vi.fn()
    render(<TestComponent isOpen={true} onClose={onClose} />)
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })
})
