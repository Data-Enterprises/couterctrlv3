import { useState } from "react";
import { useAppSelector } from "../hooks";
import zxcvbn from "zxcvbn";
import Eye from "../svgs/Eye";
import Check from "../svgs/Check";
import X from "../svgs/X";

interface TextInputProps<T> {
  query: string;
  setQuery?: (field: keyof T, query: string) => void;
  title?: string;
  name: string;
  type?: string;
  isSimple?: boolean;
  setText?: (text: string) => void;
}

// This component is used to handle Redux form state updates for text inputs
// Just make sure that when this is imported into a file that whatevr field is passed in is a keyof the redux slice's form data type
const TextInput = <T,>({
  query,
  setQuery,
  title,
  name,
  type = "text",
  isSimple = false,
  setText,
}: TextInputProps<T>) => {
  const [encrypted, setEncrypted] = useState(type === "password");
  const [inputType, setInputType] = useState<string>(type);
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSimple && setText) {
      setText(e.currentTarget.value);
    } else if (!isSimple && setQuery) {
      setQuery(name as keyof T, e.currentTarget.value);
    }
  };
  const { userInfo, selectedUserId, users } = useAppSelector(
    (state) => state.users
  );

  const handleEncryptionToggle = () => {
    setEncrypted(!encrypted);
    setInputType(encrypted ? "text" : "password");
  };

  const showMsg = () => {
    if (name === "confirm_password" && query.length > 0) {
      if (userInfo.password !== userInfo.confirm_password) {
        return "- Passwords do not match";
      } else if (userInfo.password === userInfo.confirm_password) {
        return "- Passwords Match";
      }
    }

    if (name === "password" && query.length > 0) {
      const score = zxcvbn(query).score;
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
      if (userInfo.password !== userInfo.confirm_password) {
        return "text-orange-500";
      } else if (userInfo.password === userInfo.confirm_password) {
        return "text-emerald-500";
      }
    }

    const score = zxcvbn(query).score;
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

  const showOk = () => {
    // If username is the same or doesn't change from the selected user, don't show anything
    const selectedUser = users.find(
      (user) =>
        user.username.toLowerCase() === query.toLowerCase() &&
        user.id === selectedUserId
    );
    if (selectedUser) return null;

    // find that username in users
    if (query.length > 0) {
      const exists = users.find(
        (user) => user.username.toLowerCase() === query.toLowerCase()
      );
      if (exists) {
        return <X className="absolute top-7 right-2" />;
      } else {
        return <Check className="absolute top-7 right-2" />;
      }
    }

    // return null by default for empty query
    return null;
  };

  return (
    <div className="relative">
      <label htmlFor={name} className="text-[13px] font-medium ml-1 flex gap-1">
        {title} <div data-testid={`text-input-${name}-message`} className={showTextColor()}>{showMsg()}</div>
      </label>
      <input
        data-testid={`text-input-${name}`}
        name={name}
        type={inputType}
        value={query}
        onChange={handleQueryChange}
        className="basic-input focus:border bg-custom-white"
      />
      {type === "password" && <Eye onClick={handleEncryptionToggle} />}
      {name === "password" ? (
        <div className="h-1 w-[97%] mx-auto rounded-full bg-content/10 mt-1 ">
          <div
            data-testid="pw-strength-bar"
            className={`${showPasswordStrength(zxcvbn(query).score)} h-full`}
          ></div>
        </div>
      ) : null}
      {name === "username" ? showOk() : null}
    </div>
  );
};

export default TextInput;
