interface TextInputProps {
  query: string;
  setQuery: (field: string, query: string) => void;
  title?: string;
  name: string;
}

const TextInput = ({ query, setQuery, title, name }: TextInputProps) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(name, e.target.value);
  };

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium ml-1">{title}</label>
      <input
        name={name}
        type="text"
        value={query}
        onChange={handleQueryChange}
        className="basic-input focus:border bg-custom-white"
      />
    </div>
  );
};

export default TextInput;
