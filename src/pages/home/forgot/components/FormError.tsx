interface FormErrorProps {
  message: string | null;
}

/** Why the last try was refused, inside the card, as the sign-in rail shows it. */
const FormError = ({ message }: FormErrorProps) =>
  message ? (
    <p
      role="alert"
      className="mb-4 text-[13px] leading-[1.55] text-brand_danger bg-brand_danger_bg border border-brand_danger_line rounded-lg px-3.5 py-2.5"
    >
      {message}
    </p>
  ) : null;

export default FormError;
