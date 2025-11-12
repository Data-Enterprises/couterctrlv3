import { useState } from "react";
import Eye from "../svgs/Eye";
import { useAppSelector } from "../hooks";

interface TextInputProps<T> {
  query: string;
  setQuery: (field: keyof T, query: string) => void;
  title?: string;
  name: string;
  type?: string;
}

// This component is used to handle Redux form state updates for text inputs
// Just make sure that when this is imported into a file that whatevr field is passed in is a keyof the redux slice's form data type
const TextInput = <T,>({
  query,
  setQuery,
  title,
  name,
  type = "text",
}: TextInputProps<T>) => {
  const [encrypted, setEncrypted] = useState(type === "password");
  const [inputType, setInputType] = useState<string>(type);
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(name as keyof T, e.currentTarget.value);
  };
  const userInfo = useAppSelector((state) => state.users.userInfo);

  const handleEncryptionToggle = () => {
    setEncrypted(!encrypted);
    setInputType(encrypted ? "text" : "password");
  };

  const showMsg = () => {
    if (name === "confirm_password" && query.length > 0) {
      if (userInfo.password !== userInfo.confirm_password)
        return "- Passwords do not match";
    }

    if (name === "password" && query.length > 0) {
      // check password strength
    }
  };

  return (
    <div className="relative">
      <label htmlFor={name} className="text-[13px] font-medium ml-1 flex gap-1">
        {title} <div className="text-orange-500">{showMsg()}</div>
      </label>
      <input
        name={name}
        type={inputType}
        value={query}
        onChange={handleQueryChange}
        className="basic-input focus:border bg-custom-white"
      />
      {type === "password" && <Eye onClick={handleEncryptionToggle} />}
    </div>
  );
};

export default TextInput;
