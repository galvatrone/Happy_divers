export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <p className="footer-copy">
        &copy; {new Date().getFullYear()} Happy Divers &nbsp;·&nbsp;
        Mediterranean SCUBA Since 2004 &nbsp;·&nbsp;
        PADI 5-Star &amp; SSI Facility
      </p>
      <p className="footer-tagline">
        Every dive starts with the same breath.
      </p>
    </footer>
  );
}
