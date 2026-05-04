import { useState } from "react";
import { useAppSelector } from "../../hooks";
import { useToast } from "../toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import { checkEmail, checkUsername } from "../../api/team";

interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
  className?: string;
  width?: string;
  onKeyDown?: () => void;
  validateUsername?: boolean;
  validateEmail?: boolean;
  username?: string;
  email?: string;
}

const Input = ({
  value,
  setValue,
  label,
  className = "py-1.5",
  type = "text",
  width = "w-full",
  onKeyDown,
  validateEmail = false,
  validateUsername = false,
  email,
  username,
}: InputProps) => {
  const toast = useToast();
  const [availableText, setAvailableText] = useState<string>("");
  const [textColor, setTextColor] = useState<string>("");
  const { url, token } = useAppSelector((state) => state.app);
  const testId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onKeyDown) {
      e.preventDefault();
      onKeyDown();
    }
    if (e.key === "Enter" && (validateEmail || validateUsername)) {
      e.preventDefault();
      handleValidationClick();
    }
  };

  const isValidating = validateEmail || validateUsername;

  const handleValidationClick = () => {
    if (validateEmail && email) {
      checkEmail(url, token, email)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
              setAvailableText("- Available")
              setTextColor("text-emerald-600")
          } else {
              setAvailableText("- Not Available")
              setTextColor("text-red-600")
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else if (validateUsername && username) {
      checkUsername(url, token, username)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            setAvailableText("- Available");
            setTextColor("text-emerald-600")
          } else {
            setAvailableText("- Not Available");
            setTextColor("text-red-600")
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  return (
    <div className={`${width}`}>
      <div className="flex justify-between text-[13px] items-end pr-1.5">
        <div>
          <label className="font-medium pl-0.5">{label}</label>
          <span className={`text-[10px] ${textColor}`}>{availableText}</span>
        </div>
        <div
          className={`${!isValidating ? "hidden" : "text-[10px] underline cursor-pointer hover:text-content/60 transition-all duration-200"}`}
          onClick={handleValidationClick}
        >
          Check Availability
        </div>
      </div>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`basic-input focus:border w-full bg-custom-white ${className}`}
      />
    </div>
  );
};

export default Input;
