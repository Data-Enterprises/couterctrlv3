interface TextFilterProps {
  text: string;
  setText: (text: string) => void;
}

const TextFilter = ({ text, setText }: TextFilterProps) => {
  return (
    <input
      type="text"
      className="basic-input focus:border my-4 bg-custom-white"
      value={text}
      onChange={(e) => setText(e.currentTarget.value)}
    />
  );
};

export default TextFilter;
