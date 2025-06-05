import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act }  from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { Bookmark, BookmarkCategory, SortOption, UiTheme } from '../types';

// Mock child components and services
vi.mock('./BookmarkCard', () => ({
  default: vi.fn(({ bookmark }) => <div data-testid={`bookmark-card-${bookmark.id}`}>{bookmark.name}</div>)
}));
vi.mock('./BookmarkForm', () => ({ default: vi.fn(() => <div data-testid="bookmark-form">Bookmark Form</div>) }));
vi.mock('./Modal', () => ({ default: vi.fn(({ children, isOpen }) => isOpen ? <div data-testid="modal">{children}</div> : null) }));
vi.mock('./SettingsModal', () => ({ default: vi.fn(() => <div data-testid="settings-modal">Settings Modal</div>) }));

const mockBookmarks: Bookmark[] = [
  { id: '1', name: 'Unread Alpha', url: 'https://a.com', description: '', category: BookmarkCategory.TECHNOLOGY, createdAt: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T10:00:00Z', isRead: false, tags: ['dev'] },
  { id: '2', name: 'Read Beta', url: 'https://b.com', description: '', category: BookmarkCategory.PERSONAL, createdAt: '2023-01-02T10:00:00Z', updatedAt: '2023-01-02T10:00:00Z', isRead: true, tags: ['test'] },
  { id: '3', name: 'Unread Gamma (Undefined)', url: 'https://c.com', description: '', category: BookmarkCategory.WORK, createdAt: '2023-01-03T10:00:00Z', updatedAt: '2023-01-03T10:00:00Z', isRead: undefined, tags: ['dev', 'test'] },
  { id: '4', name: 'Read Delta', url: 'https://d.com', description: '', category: BookmarkCategory.LEARNING, createdAt: '2023-01-04T10:00:00Z', updatedAt: '2023-01-04T10:00:00Z', isRead: true, tags: [] },
];

const mockOnSaveBookmark = vi.fn();
const mockOnDeleteBookmark = vi.fn();
const mockOnVisitBookmark = vi.fn();
const mockOnToggleReadStatus = vi.fn();
const mockOnLock = vi.fn();
const mockOnToggleTheme = vi.fn();
const mockOnExportBookmarks = vi.fn();
const mockOnImportBookmarks = vi.fn();
const mockOnSetUiTheme = vi.fn();
const mockOnSetYoutubeApiKey = vi.fn();

const defaultProps = {
  bookmarks: mockBookmarks,
  onSaveBookmark: mockOnSaveBookmark,
  onDeleteBookmark: mockOnDeleteBookmark,
  onVisitBookmark: mockOnVisitBookmark,
  onToggleReadStatus: mockOnToggleReadStatus,
  onLock: mockOnLock,
  isSaving: false,
  currentTheme: 'dark' as 'light' | 'dark',
  onToggleTheme: mockOnToggleTheme,
  onExportBookmarks: mockOnExportBookmarks,
  onImportBookmarks: mockOnImportBookmarks,
  uiTheme: 'current' as UiTheme,
  onSetUiTheme: mockOnSetUiTheme,
  youtubeApiKey: '',
  onSetYoutubeApiKey: mockOnSetYoutubeApiKey,
  quickAddUrl: null,
  onClearQuickAddUrl: vi.fn(),
};

describe('Dashboard - Mark as Read/Unread Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for child components if they store internal state based on props
    vi.mock('./BookmarkCard', () => ({
      default: vi.fn(({ bookmark }) => <div data-testid={`bookmark-card-${bookmark.id}`} data-bookmark-name={bookmark.name}>{bookmark.name}</div>)
    }));
  });

  it('should have a filter for read status (All, Read, Unread)', () => {
    render(<Dashboard {...defaultProps} />);
    const readStatusFilter = screen.getByRole('combobox', { name: /all read status/i }); // Check accessible name or label if explicit
    expect(readStatusFilter).toBeInTheDocument();
    expect(screen.getByText('All Read Status')).toBeInTheDocument(); // Check if default option is rendered
    expect(screen.getByRole('option', { name: 'Unread' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Read' })).toBeInTheDocument();
  });

  it('filters bookmarks by "Unread" status', async () => {
    render(<Dashboard {...defaultProps} />);
    const readStatusFilter = screen.getByRole('combobox', { name: /all read status/i });

    await act(async () => {
      await userEvent.selectOptions(readStatusFilter, 'UNREAD');
    });

    expect(screen.getByTestId('bookmark-card-1')).toBeInTheDocument(); // Unread Alpha (isRead: false)
    expect(screen.queryByTestId('bookmark-card-2')).not.toBeInTheDocument(); // Read Beta (isRead: true)
    expect(screen.getByTestId('bookmark-card-3')).toBeInTheDocument(); // Unread Gamma (isRead: undefined)
    expect(screen.queryByTestId('bookmark-card-4')).not.toBeInTheDocument(); // Read Delta (isRead: true)
  });

  it('filters bookmarks by "Read" status', async () => {
    render(<Dashboard {...defaultProps} />);
    const readStatusFilter = screen.getByRole('combobox', { name: /all read status/i });

    await act(async () => {
      await userEvent.selectOptions(readStatusFilter, 'READ');
    });

    expect(screen.queryByTestId('bookmark-card-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('bookmark-card-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-4')).toBeInTheDocument();
  });

  it('shows all bookmarks when filter is "All"', async () => {
    render(<Dashboard {...defaultProps} />);
    const readStatusFilter = screen.getByRole('combobox', { name: /all read status/i });

    await act(async () => {
      await userEvent.selectOptions(readStatusFilter, 'ALL');
    });

    expect(screen.getByTestId('bookmark-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-4')).toBeInTheDocument();
  });

  it('should have sort options for read status', () => {
    render(<Dashboard {...defaultProps} />);
    const sortDropdown = screen.getByLabelText('Sort by:');
    expect(sortDropdown).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Read Status (Read First)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Read Status (Unread First)' })).toBeInTheDocument();
  });

  it('sorts by "isRead_asc" (Unread first)', async () => {
    render(<Dashboard {...defaultProps} bookmarks={mockBookmarks} />); // Pass fresh copy
    const sortDropdown = screen.getByLabelText('Sort by:');

    await act(async () => {
      await userEvent.selectOptions(sortDropdown, 'isRead_asc');
    });

    const renderedBookmarks = screen.getAllByTestId(/bookmark-card-/);
    // Expected order: Unread Alpha (false), Unread Gamma (undefined), Read Beta (true), Read Delta (true)
    // Note: Order between items with same read status will depend on secondary sort (default: createdAt desc)
    // For this test, we mainly care that unread come before read.
    const names = renderedBookmarks.map(el => el.getAttribute('data-bookmark-name'));

    // Check that unread items come before read items
    const firstReadIndex = names.findIndex(name => name === 'Read Beta' || name === 'Read Delta');
    const lastUnreadIndex = Math.max(names.lastIndexOf('Unread Alpha'), names.lastIndexOf('Unread Gamma (Undefined)'));

    expect(lastUnreadIndex).toBeLessThan(firstReadIndex);

    // More specific check if secondary sort is predictable (e.g. createdAt desc for items with same read status)
    // Unread (sorted by createdAt desc): Unread Gamma (Undefined) (Jan 3), Unread Alpha (Jan 1)
    // Read (sorted by createdAt desc): Read Delta (Jan 4), Read Beta (Jan 2)
    // So, with isRead_asc: Unread Gamma, Unread Alpha, Read Delta, Read Beta (if stable sort or secondary sort is applied)
    // The current implementation of sort in Dashboard does not explicitly define secondary sort for read status,
    // it relies on the original array order or previous sort state if any.
    // For robust testing, one might need to ensure stable sort or defined secondary sort.
    // For now, checking group separation (unread before read) is the primary goal.
    expect(names.slice(0, 2)).toEqual(expect.arrayContaining(['Unread Alpha', 'Unread Gamma (Undefined)']));
    expect(names.slice(2, 4)).toEqual(expect.arrayContaining(['Read Beta', 'Read Delta']));

  });

  it('sorts by "isRead_desc" (Read first)', async () => {
    render(<Dashboard {...defaultProps} bookmarks={mockBookmarks} />);
    const sortDropdown = screen.getByLabelText('Sort by:');

    await act(async () => {
      await userEvent.selectOptions(sortDropdown, 'isRead_desc');
    });

    const renderedBookmarks = screen.getAllByTestId(/bookmark-card-/);
    const names = renderedBookmarks.map(el => el.getAttribute('data-bookmark-name'));

    // Expected order: Read Beta (true), Read Delta (true), Unread Alpha (false), Unread Gamma (undefined)
    const firstUnreadIndex = names.findIndex(name => name === 'Unread Alpha' || name === 'Unread Gamma (Undefined)');
    const lastReadIndex = Math.max(names.lastIndexOf('Read Beta'), names.lastIndexOf('Read Delta'));

    expect(lastReadIndex).toBeLessThan(firstUnreadIndex);
    expect(names.slice(0, 2)).toEqual(expect.arrayContaining(['Read Beta', 'Read Delta']));
    expect(names.slice(2, 4)).toEqual(expect.arrayContaining(['Unread Alpha', 'Unread Gamma (Undefined)']));
  });

  it('passes onToggleReadStatus to BookmarkCard', () => {
    render(<Dashboard {...defaultProps} bookmarks={[mockBookmarks[0]]} />); // Render with one bookmark
    expect(require('./BookmarkCard').default).toHaveBeenCalledWith(
      expect.objectContaining({
        bookmark: mockBookmarks[0],
        onToggleReadStatus: mockOnToggleReadStatus, // Check if the prop is passed
      }),
      expect.anything() // For the second argument (context or ref)
    );
  });
});
