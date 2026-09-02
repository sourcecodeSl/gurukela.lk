import { Component } from 'react'

/**
 * Catches render-time errors so a single broken page shows a readable message
 * instead of a blank screen. In production this is the last line of defence.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="auth-wrap">
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title">Something went wrong</h1>
          <p className="muted small auth-sub">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}
