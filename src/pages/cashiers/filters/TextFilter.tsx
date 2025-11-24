interface TextFilterProps {
  text: string;
  setText: (text: string) => void;
  type?: string;
}

const TextFilter = ({ text, setText, type }: TextFilterProps) => {
  return (
    <>
      {type === "Sale Date" ? (
        <div className="text-center text-sm">Use date format MM/DD/YYYY</div>
      ) : null}
      {type === "UPC" && (
        <div className="text-center text-sm">Enter partial or full UPC</div>
      )}
      {type === "Description" && (
        <div className="text-center text-sm">
          Enter partial or full Description
        </div>
      )}
      <input
        type="text"
        className="basic-input focus:border my-4 bg-custom-white"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
      />
    </>
  );
};

export default TextFilter;
