// Components
import logo from "../../../assets/portal/logo.webp";
import logoReversed from "../../../assets/portal/logo-reversed.webp";

interface LogoProps {
  onNavy: boolean;
}

/** The CounterCtrl logo at the left of the title bar. It is sized by height,
 *  so on a 390px phone it can't push the avatar (and Sign out) off the edge.
 *  The light and reversed logos cross-fade as the bar turns navy. */
const Logo = ({ onNavy }: LogoProps) => {
  return (
    <div className="flex min-w-0 flex-none items-center overflow-hidden px-2">
      {/* Both logos are always rendered and cross-fade with the bar */}
      <div className="relative h-8 max-w-full">
        <img
          src={logo}
          alt="CounterCtrl Cloud"
          className={`h-8 w-auto max-w-full object-contain transition-opacity duration-300 ease-in-out ${onNavy ? "opacity-0" : "opacity-100"}`}
        />
        <img
          src={logoReversed}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-8 w-auto max-w-full object-contain transition-opacity duration-300 ease-in-out ${onNavy ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
};

export default Logo;
