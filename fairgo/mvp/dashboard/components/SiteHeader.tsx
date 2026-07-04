import { AussieOSWordmark } from "./AussieOSWordmark";

export function SiteHeader() {
  return (
    <div className="site-header">
      <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <AussieOSWordmark />
        <nav className="flex items-center gap-5">
          <a
            href="https://aussieos.xyz/fairgo/"
            target="_blank"
            rel="noopener"
            className="text-white text-xs font-sans uppercase tracking-[0.1em] hover:text-teal-400 transition-colors"
          >
            Learn More
          </a>
          <a
            href="https://app.notion.com/p/FairGo-A-Cultural-Technical-Protocol-for-Measurable-Fairness-29593d942ed080efabafcce6269e4f96"
            target="_blank"
            rel="noopener"
            className="text-white text-xs font-sans uppercase tracking-[0.1em] hover:text-teal-400 transition-colors"
          >
            Read the Specification
          </a>
        </nav>
      </div>
    </div>
  );
}
