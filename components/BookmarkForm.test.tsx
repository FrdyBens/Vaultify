import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkForm from './BookmarkForm';
import { BookmarkCategory, Bookmark } from '../types'; // Assuming types.ts is in the parent directory

// Mock aiService
vi.mock('../services/aiService', () => ({
  isAiServiceAvailable: vi.fn(),
  generateBookmarkInfo: vi.fn(),
  generateAiCategorization: vi.fn(),
}));

// Mock metadataService (if parts of it are called, like getFaviconUrl, though not strictly necessary for notes tests)
vi.mock('../services/metadataService', () => ({
  getFaviconUrl: vi.fn().mockReturnValue(''),
  getYouTubeThumbnailUrl: vi.fn().mockReturnValue(''),
  isDirectImageUrl: vi.fn().mockReturnValue(false),
  extractYouTubeVideoId: vi.fn().mockReturnValue(null),
  getYouTubeVideoDetails: vi.fn().mockResolvedValue(null),
  isYouTubeUrl: vi.fn().mockReturnValue(false),
}));


const mockBookmark: Bookmark = {
  id: '1',
  name: 'Test Bookmark',
  url: 'https://example.com',
  description: 'Test description',
  category: BookmarkCategory.TECHNOLOGY,
  tags: ['test', 'tech'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: 'Initial notes here',
  isRead: false,
};

const mockOnSave = vi.fn();
const mockOnCancel = vi.fn();

describe('BookmarkForm - Notes Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    // Default mock implementations
    require('../services/aiService').isAiServiceAvailable.mockReturnValue(true);
  });

  it('should display initial notes when editing a bookmark', () => {
    render(
      <BookmarkForm
        bookmarkToEdit={mockBookmark}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSaving={false}
      />
    );
    const notesTextarea = screen.getByPlaceholderText('Add any personal notes for this bookmark...') as HTMLTextAreaElement;
    expect(notesTextarea.value).toBe('Initial notes here');
  });

  it('should update notes state when typing in the textarea', async () => {
    render(
      <BookmarkForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSaving={false}
      />
    );
    const notesTextarea = screen.getByPlaceholderText('Add any personal notes for this bookmark...') as HTMLTextAreaElement;
    await userEvent.type(notesTextarea, 'New notes typed by user');
    expect(notesTextarea.value).toBe('New notes typed by user');
  });

  it('should call onSave with the correct notes data when adding a new bookmark', async () => {
    render(
      <BookmarkForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSaving={false}
      />
    );

    // Fill required fields
    await userEvent.type(screen.getByLabelText('URL'), 'https://newurl.com');
    await userEvent.type(screen.getByLabelText('Name'), 'New Bookmark Name');

    const notesTextarea = screen.getByPlaceholderText('Add any personal notes for this bookmark...') as HTMLTextAreaElement;
    await userEvent.type(notesTextarea, 'These are the notes for the new bookmark.');

    await act(async () => {
        fireEvent.submit(screen.getByRole('button', { name: /Add Bookmark/i }));
    });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'These are the notes for the new bookmark.',
        url: 'https://newurl.com',
        name: 'New Bookmark Name',
      })
    );
  });

  it('should call onSave with updated notes data when editing a bookmark', async () => {
    render(
      <BookmarkForm
        bookmarkToEdit={mockBookmark}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSaving={false}
      />
    );

    const notesTextarea = screen.getByPlaceholderText('Add any personal notes for this bookmark...') as HTMLTextAreaElement;
    await userEvent.clear(notesTextarea); // Clear initial notes
    await userEvent.type(notesTextarea, 'Updated notes for existing bookmark.');

    await act(async () => {
        fireEvent.submit(screen.getByRole('button', { name: /Update Bookmark/i }));
    });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockBookmark.id,
        notes: 'Updated notes for existing bookmark.',
        // other fields should also be present
        name: mockBookmark.name,
        url: mockBookmark.url,
      })
    );
  });
});

// Placeholder for AI Re-generation tests to be added later
describe('BookmarkForm - AI Re-generation Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    require('../services/aiService').isAiServiceAvailable.mockReturnValue(true);
    require('../services/aiService').generateBookmarkInfo.mockResolvedValue({ title: 'AI Title', description: 'AI Desc', tags: ['ai', 'tag'] });
    require('../services/aiService').generateAiCategorization.mockResolvedValue({ primaryCategoryAI: 'AI Primary', secondaryCategoryAI: 'AI Secondary', subcategoriesAI: ['ai', 'sub'] });
  });

  it('re-generation buttons should be disabled if AI service is not available', async () => {
    require('../services/aiService').isAiServiceAvailable.mockReturnValue(false);
    render(<BookmarkForm onSave={mockOnSave} onCancel={mockOnCancel} isSaving={false} initialUrlFromClipboard="https://example.com" />);

    // URL needs to be there for buttons to even consider being enabled
    await userEvent.type(screen.getByLabelText('URL'), 'https://example.com');


    const regenInfoButton = screen.queryByRole('button', { name: /Re-gen Info/i });
    const regenCategoriesButton = screen.queryByRole('button', { name: /Re-gen Categories/i });

    expect(regenInfoButton).toBeNull() // Query does not find it, or check if it's visibly disabled if it renders but hidden/styled
    expect(regenCategoriesButton).toBeNull()
    // Check for the message "AI features disabled..."
    expect(screen.getByText(/AI features disabled\. Add Gemini API Key in settings\./i)).toBeInTheDocument();

  });

  it('re-generation buttons should be disabled if URL is missing', () => {
    render(<BookmarkForm onSave={mockOnSave} onCancel={mockOnCancel} isSaving={false} />);
    // No URL entered
    const regenInfoButton = screen.queryByRole('button', { name: /Re-gen Info/i });
    // For categories, name is also needed
    const regenCategoriesButton = screen.queryByRole('button', { name: /Re-gen Categories/i });

    expect(regenInfoButton).toBeNull(); // or check for disabled attribute if it renders
    expect(regenCategoriesButton).toBeNull(); // or check for disabled attribute
  });

  it('clicking "Re-gen Info" calls generateBookmarkInfo and updates fields', async () => {
    render(<BookmarkForm onSave={mockOnSave} onCancel={mockOnCancel} isSaving={false} />);

    const urlInput = screen.getByLabelText('URL');
    await userEvent.type(urlInput, 'https://example.com');

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const descriptionTextarea = screen.getByPlaceholderText('A brief description of the bookmark...') as HTMLTextAreaElement;
    const tagsInput = screen.getByPlaceholderText('tech, news, cool stuff') as HTMLInputElement;

    // Initial values can be empty or something else
    expect(nameInput.value).toBe('');
    expect(descriptionTextarea.value).toBe('');
    expect(tagsInput.value).toBe('');

    const regenInfoButton = screen.getByRole('button', { name: /Re-gen Info/i });
    await act(async () => {
        fireEvent.click(regenInfoButton);
    });

    expect(require('../services/aiService').generateBookmarkInfo).toHaveBeenCalledWith('https://example.com');
    expect(nameInput.value).toBe('AI Title');
    expect(descriptionTextarea.value).toBe('AI Desc');
    expect(tagsInput.value).toBe('ai, tag');
  });

  it('clicking "Re-gen Categories" calls generateAiCategorization and updates fields', async () => {
    render(<BookmarkForm onSave={mockOnSave} onCancel={mockOnCancel} isSaving={false} />);

    const urlInput = screen.getByLabelText('URL');
    await userEvent.type(urlInput, 'https://example.com');
    const nameInput = screen.getByLabelText('Name');
    await userEvent.type(nameInput, 'User Title'); // Name is needed for this button

    const primaryCategoryInput = screen.getByLabelText('Primary AI Category') as HTMLInputElement;
    const secondaryCategoryInput = screen.getByLabelText('Secondary AI Category') as HTMLInputElement;
    const subcategoriesInput = screen.getByLabelText('AI Subcategories (comma-separated)') as HTMLInputElement;

    const regenCategoriesButton = screen.getByRole('button', { name: /Re-gen Categories/i });
    await act(async () => {
      fireEvent.click(regenCategoriesButton);
    });

    expect(require('../services/aiService').generateAiCategorization).toHaveBeenCalledWith('User Title', '', [], 'https://example.com');
    expect(primaryCategoryInput.value).toBe('AI Primary');
    expect(secondaryCategoryInput.value).toBe('AI Secondary');
    expect(subcategoriesInput.value).toBe('ai, sub');
  });

  it('shows loading spinner and disables button during "Re-gen Info"', async () => {
    const generateBookmarkInfoMock = require('../services/aiService').generateBookmarkInfo;
    generateBookmarkInfoMock.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ title: 'Done', description: 'Done Desc', tags: ['done'] }), 100))); // delayed promise

    render(<BookmarkForm onSave={mockOnSave} onCancel={mockOnCancel} isSaving={false} />);
    await userEvent.type(screen.getByLabelText('URL'), 'https://example.com');

    const regenInfoButton = screen.getByRole('button', { name: /Re-gen Info/i });

    // Start the async operation but don't wait for it to complete yet
    act(() => {
        fireEvent.click(regenInfoButton);
    });

    // Check for spinner and disabled state immediately after click
    expect(regenInfoButton.querySelector('svg[data-icon="spinner"]')).toBeInTheDocument(); // Assuming SpinnerIcon has a unique attribute or class
    expect(regenInfoButton).toBeDisabled();

    // Wait for the promise to resolve
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // wait for mock to resolve
    });

    // Check that spinner is gone and button is enabled
    expect(regenInfoButton.querySelector('svg[data-icon="spinner"]')).not.toBeInTheDocument();
    expect(regenInfoButton).not.toBeDisabled();
    expect(screen.getByLabelText('Name').value).toBe('Done');
  });

  // Similar test for "Re-gen Categories" loading state can be added
});
