import { getErrorMessage } from '../../services/api'

// =============================================================
// PIECES SHARED BY THE RANKING AND MATCH HISTORY SCREENS
// =============================================================

type QueryStateProps = {
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  error: unknown
  emptyMessage: string
  onRetry: () => void
}

// LOADING / ERROR / EMPTY MESSAGES. RETURNS NULL WHEN THERE IS DATA TO SHOW
export function QueryState(props: QueryStateProps) {
  if (props.isPending) {
    return <p className="leaderboard-message" role="status">Loading…</p>
  }

  if (props.isError) {
    return (
      <div className="leaderboard-error" role="alert">
        <p className="leaderboard-message">{getErrorMessage(props.error)}</p>
        <button type="button" className="options-menu-secondary-button" onClick={props.onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (props.isEmpty) {
    return <p className="leaderboard-message" role="status">{props.emptyMessage}</p>
  }

  return null
}

type PaginationProps = {
  page: number
  totalPages: number
  // TRUE WHILE THE NEXT PAGE IS LOADING, SO THE BUTTONS CAN'T BE SPAMMED
  isLoadingPage: boolean
  onChangePage: (page: number) => void
}

export function Pagination(props: PaginationProps) {
  return (
    <nav className="leaderboard-pagination" aria-label="Pages">
      <button
        type="button"
        className="options-menu-secondary-button leaderboard-page-button"
        disabled={props.page <= 1 || props.isLoadingPage}
        onClick={() => props.onChangePage(props.page - 1)}
      >
        Previous
      </button>

      <span className="leaderboard-page-label" aria-live="polite">
        Page {props.page} of {props.totalPages}
      </span>

      <button
        type="button"
        className="options-menu-secondary-button leaderboard-page-button"
        disabled={props.page >= props.totalPages || props.isLoadingPage}
        onClick={() => props.onChangePage(props.page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
