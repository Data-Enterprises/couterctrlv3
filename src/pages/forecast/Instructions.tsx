import logo from "../../assets/forecast_example.png";

const instructions: string[] = [
  "Select date range",
  "Then stores/group",
  "Upload a .csv file",
  "One header: upc",
  "One upc per line",
];

const Instructions = () => {
  return (
    <div className=" bg-custom-white px-4 pb-4 rounded-lg shadow-lg">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="font-medium text-sm py-2 underline">
            Instructions:
          </div>
          <ol>
            {instructions.map((inst, index) => (
              <li key={index} className="py-0.5">
                {index + 1}. {inst}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mt-1.5 font-medium underline">Example:</div>
          <img className="h-40" src={logo} alt="Mikto" />
        </div>
      </div>
    </div>
  );
};

export default Instructions;
