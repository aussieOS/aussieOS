import { AussieOSWordmark } from "./AussieOSWordmark";

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <AussieOSWordmark />
        <div className="foot-links">
          <a href="https://aussieos.xyz" target="_blank" rel="noopener">
            aussieos.xyz
          </a>
          <a href="https://aussieos.xyz/fairgo" target="_blank" rel="noopener">
            aussieos.xyz/fairgo
          </a>
        </div>
        <div className="foot-contact">
          <a href="https://x.com/aussieosxyz/" target="_blank" rel="noopener">
            @aussieosxyz
          </a>
          <a href="mailto:aussieosxyz@gmail.com">aussieosxyz@gmail.com</a>
        </div>
        <div className="meta">FGV MVP &nbsp;·&nbsp; AussieOS Collective</div>
      </div>
    </footer>
  );
}
