import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="error-card mx-auto my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="error-illustration" src="/assets/images/svg/404.svg" alt="Page not found illustration" />
      <div className="error-code">404</div>
      <h1 className="h3 mb-2">Page Not Found</h1>
      <p className="text-muted mb-4">
        The requested telehealth clinical page or patient portal route could not be found.
      </p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        <Link className="btn btn-primary" href="/">
          <i className="bi bi-house-door" aria-hidden="true" /> Back to Home
        </Link>
        <Link className="btn btn-outline-secondary" href="/login">
          <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Sign In
        </Link>
      </div>
    </section>
  );
}
