import { useState } from "react";
import zxcvbn from "zxcvbn";
import Eye from "../../svgs/Eye";

interface PasswrodInputProps {
  label: string;
  name: string;
  text: string;
  setText: (x: string) => void;
  className?: string;
  leftCompare?: string;
  rightCompare?: string;
}

const PasswordInput = ({
  label,
  name,
  text,
  setText,
  className,
  leftCompare,
  rightCompare,
}: PasswrodInputProps) => {
  const [inputType, setInputType] = useState<string>("password");
  const [encrypted, setEncrypted] = useState(inputType === "password");

  const handleEncryptionToggle = () => {
    setEncrypted(!encrypted);
    setInputType(encrypted ? "text" : "password");
  };

  const showMsg = () => {
    if (name === "confirm_password" && text.length > 0) {
      if (leftCompare !== rightCompare) {
        return "- Passwords do not match";
      } else if (leftCompare === rightCompare) {
        return "- Passwords Match";
      }
    }

    if (name === "password" && text.length > 0) {
      const score = zxcvbn(text).score;
      // check password strength
      switch (score) {
        case 0:
          return "Very Weak";
        case 1:
          return "Weak";
        case 2:
          return "Moderate";
        case 3:
          return "Strong";
        case 4:
          return "Very Strong";
      }
    }
  };

  const showPasswordStrength = (score: number) => {
    switch (score) {
      case 0:
        return "w-0 ";
      case 1:
        return "w-1/4 bg-red-500";
      case 2:
        return "w-1/2 bg-yellow-500";
      case 3:
        return "w-3/4 bg-orange-500";
      case 4:
        return "w-full bg-emerald-500";
    }
  };
  const showTextColor = () => {
    if (name === "confirm_password") {
      if (leftCompare !== rightCompare) {
        return "text-orange-500";
      } else if (leftCompare === rightCompare) {
        return "text-emerald-500";
      }
    }

    const score = zxcvbn(text).score;
    switch (score) {
      case 0:
        return "text-content";
      case 1:
        return "text-red-500";
      case 2:
        return "text-yellow-500";
      case 3:
        return "text-orange-500";
      case 4:
        return "text-emerald-500";
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.currentTarget.value);
  };

  return (
    <div className="relative">
      <label htmlFor={name} className="text-sm font-medium ml-1 flex gap-1">
        {label}
        <div
          data-testid={`text-input-${name}-message`}
          className={showTextColor()}
        >
          {showMsg()}
        </div>
      </label>
      <input
        data-testid={`text-input-${name}`}
        name={name}
        type={inputType}
        value={text}
        onChange={handleTextChange}
        className={`basic-input focus:border bg-custom-white ${className}`}
      />
      <Eye onClick={handleEncryptionToggle} />
      <div className="h-1 w-[97%] mx-auto rounded-full bg-content/10 mt-1 ">
        <div
          data-testid="pw-strength-bar"
          className={`${showPasswordStrength(zxcvbn(text).score)} h-full`}
        ></div>
      </div>
    </div>
  );
};

export default PasswordInput;
