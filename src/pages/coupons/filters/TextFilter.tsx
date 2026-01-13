interface TextFilterProps {
  text: string;
  setText: (value: string) => void;
}

const TextFilter = ({ text, setText }: TextFilterProps) => {
  return (
    <div className="mb-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="basic-input focus:border bg-custom-white"
      />
    </div>
  );
};

export default TextFilter;
