interface TextInputProps<T> {
  query: string;
  setQuery: (field: keyof T, query: string) => void;
  title?: string;
  name: string;
}

// This component is used to handle Redux form state updates for text inputs
// Just make sure that when this is imported into a file that whatevr field is passed in is a keyof the redux slice's form data type
const TextInput = <T,>({ query, setQuery, title, name }: TextInputProps<T>) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(name as keyof T, e.currentTarget.value);
  };

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium ml-1">
        {title}
      </label>
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
