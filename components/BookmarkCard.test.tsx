import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkCard from './BookmarkCard';
import { Bookmark, BookmarkCategory, UiTheme } from '../types';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon'; // Used for read
import XCircleIcon from './icons/XCircleIcon'; // Used for unread

// Mock icons used internally by BookmarkCard if they cause issues, or ensure they are simple enough not to.
// For this test, we'll assume they render without issues.
// We are also mocking the ones we will look for to verify read/unread state.
vi.mock('./icons/ClipboardCheckIcon', () => ({ default: (props: any) => <svg {...props} data-testid="clipboard-check-icon" /> }));
vi.mock('./icons/XCircleIcon', () => ({ default: (props: any) => <svg {...props} data-testid="x-circle-icon" /> }));
vi.mock('./icons/PencilIcon', () => ({ default: (props: any) => <svg {...props} data-testid="pencil-icon" /> }));
vi.mock('./icons/TrashIcon', () => ({ default: (props: any) => <svg {...props} data-testid="trash-icon" /> }));
vi.mock('./icons/LockIcon', () => ({ default: (props: any) => <svg {...props} data-testid="lock-icon" /> }));


const mockBookmarkBase: Bookmark = {
  id: '1',
  name: 'Test Bookmark',
  url: 'https://example.com',
  description: 'Test description',
  category: BookmarkCategory.TECHNOLOGY,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isRead: false,
};

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnVisit = vi.fn();
const mockOnToggleReadStatus = vi.fn();

describe('BookmarkCard - Notes Feature', () => {
  it('should display notes if present (current theme)', () => {
    const bookmarkWithNotes: Bookmark = { ...mockBookmarkBase, notes: 'These are important notes.' };
    render(
      <BookmarkCard
        bookmark={bookmarkWithNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="current"
      />
    );
    expect(screen.getByText('Notes:')).toBeInTheDocument();
    expect(screen.getByText('These are important notes.')).toBeInTheDocument();
  });

  it('should not display notes section if notes are absent (current theme)', () => {
    const bookmarkWithoutNotes: Bookmark = { ...mockBookmarkBase, notes: undefined };
    render(
      <BookmarkCard
        bookmark={bookmarkWithoutNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="current"
      />
    );
    expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
  });

  it('should display notes if present (visual theme)', () => {
    const bookmarkWithNotes: Bookmark = { ...mockBookmarkBase, notes: 'Visual theme notes.' };
    render(
      <BookmarkCard
        bookmark={bookmarkWithNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="visual"
      />
    );
    // In visual theme, notes might be directly rendered or inside a specific element
    expect(screen.getByText((content, element) => content.startsWith('Notes:') && element.tagName.toLowerCase() === 'strong')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('Visual theme notes.') && element.tagName.toLowerCase() === 'p')).toBeInTheDocument();
  });

  it('should not display notes section if notes are absent (visual theme)', () => {
    const bookmarkWithoutNotes: Bookmark = { ...mockBookmarkBase, notes: undefined };
    render(
      <BookmarkCard
        bookmark={bookmarkWithoutNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="visual"
      />
    );
    expect(screen.queryByText((content, element) => content.startsWith('Notes:'))).not.toBeInTheDocument();
  });
});

describe('BookmarkCard - Mark as Read/Unread Feature', () => {
  it('should have a button to toggle read status (current theme)', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmarkBase}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="current"
      />
    );
    // The button might be identified by its title or the icon it contains
    expect(screen.getByTitle('Mark as Read')).toBeInTheDocument();
  });

  it('clicking toggle read status button calls onToggleReadStatus with bookmark ID (current theme)', async () => {
    render(
      <BookmarkCard
        bookmark={mockBookmarkBase}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus}
        uiTheme="current"
      />
    );
    const toggleButton = screen.getByTitle('Mark as Read');
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(mockOnToggleReadStatus).toHaveBeenCalledWith(mockBookmarkBase.id);
  });

  it('should visually indicate read status as "unread" (current theme)', () => {
    const unreadBookmark: Bookmark = { ...mockBookmarkBase, isRead: false };
    const { container } = render(
      <BookmarkCard
        bookmark={unreadBookmark}
        onEdit={mockOnEdit} onDelete={mockOnDelete} onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus} uiTheme="current"
      />
    );
    // Check for absence of opacity class or presence of "Mark as Read" icon
    expect(container.firstChild).not.toHaveClass('opacity-70'); // or whatever class indicates read
    expect(screen.getByTitle('Mark as Read').querySelector('[data-testid="clipboard-check-icon"]')).toBeInTheDocument();
  });

  it('should visually indicate read status as "read" (current theme)', () => {
    const readBookmark: Bookmark = { ...mockBookmarkBase, isRead: true };
    const { container } = render(
      <BookmarkCard
        bookmark={readBookmark}
        onEdit={mockOnEdit} onDelete={mockOnDelete} onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus} uiTheme="current"
      />
    );
    // Check for presence of opacity class or presence of "Mark as Unread" icon
    expect(container.firstChild).toHaveClass('opacity-70'); // or specific dark mode opacity
    expect(screen.getByTitle('Mark as Unread').querySelector('[data-testid="x-circle-icon"]')).toBeInTheDocument();
  });

  // Visual Theme Tests for Read/Unread
   it('should have a button to toggle read status (visual theme)', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmarkBase}
        onEdit={mockOnEdit} onDelete={mockOnDelete} onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus} uiTheme="visual"
      />
    );
    expect(screen.getByTitle('Mark as Read')).toBeInTheDocument();
  });

  it('clicking toggle read status button calls onToggleReadStatus (visual theme)', async () => {
    render(
      <BookmarkCard
        bookmark={mockBookmarkBase}
        onEdit={mockOnEdit} onDelete={mockOnDelete} onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus} uiTheme="visual"
      />
    );
    const toggleButton = screen.getByTitle('Mark as Read');
     await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(mockOnToggleReadStatus).toHaveBeenCalledWith(mockBookmarkBase.id);
  });

  it('should visually indicate read status as "read" (visual theme)', () => {
    const readBookmark: Bookmark = { ...mockBookmarkBase, isRead: true };
    const { container } = render(
      <BookmarkCard
        bookmark={readBookmark}
        onEdit={mockOnEdit} onDelete={mockOnDelete} onVisit={mockOnVisit}
        onToggleReadStatus={mockOnToggleReadStatus} uiTheme="visual"
      />
    );
    expect(container.firstChild).toHaveClass('opacity-70');
    expect(screen.getByTitle('Mark as Unread').querySelector('[data-testid="x-circle-icon"]')).toBeInTheDocument();
  });
});
