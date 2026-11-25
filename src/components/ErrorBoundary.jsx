import { Component } from 'react';

import { PawSvg } from './Icons';

import './ErrorBoundary.css';

// Reload and Home only, never an email or phone: a faked failure mustn't reveal either.
function PageError({ isFullPage }) {
  return (
    <div className={`page-error${isFullPage ? ' page-error--full' : ''}`} role="alert">
      <PawSvg className="page-error-paw" aria-hidden="true" />
      <h2 className="page-error-title">Sorry — this page didn&apos;t load properly</h2>
      <p className="page-error-text">Reloading usually fixes it.</p>
      <div className="page-error-actions">
        <button type="button" className="page-error-button" onClick={() => window.location.reload()}>Reload the page</button>
        <a href="/" className="page-error-link">Go to the home page</a>
      </div>
    </div>
  );
}

// The site's one class component: React still has no hook that catches an error while
// a page is drawn. Without this, any such error leaves the visitor a blank white page.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    const { children, isFullPage = false } = this.props;
    if (this.state.hasError) return <PageError isFullPage={isFullPage} />;
    return children;
  }
}

export default ErrorBoundary;
