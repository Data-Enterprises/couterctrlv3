import { useState } from "react";
import Eye from "../svgs/Eye";

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

  const handleEncryptionToggle = () => {
    setEncrypted(!encrypted);
    setInputType(encrypted ? "text" : "password");
  };

  return (
    <div className="relative">
      <label htmlFor={name} className="text-[13px] font-medium ml-1">
        {title}
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
