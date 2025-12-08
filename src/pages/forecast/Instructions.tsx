const upcs: string[] = [
  "7239277080",
  "88855900112",
  "88855900104",
  "..."
  // "88855900103",
  // "88855900105",
  // "88855900108",
  // "88855900106",
];

const instructions: string[] = [
  "Select date range",
  "Select store or group",
  "Upload a .csv file",
  "One header: upc",
  "One upc per line",
];

const Instructions = () => {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 bg-custom-white rounded-lg shadow-lg text-sm">
      <div>
        <ol>
          {instructions.map((inst, index) => (
            <li key={index} className="py-0.5">
              {index + 1}. {inst}
            </li>
          ))}
        </ol>
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-left border border-content pl-2">upc</th>
          </tr>
        </thead>
        <tbody>
          {upcs.map((u, i) => (
            <tr key={i}>
              <td className="text-right border border-content pl-4 pr-1 py-0.5">
                {u}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Instructions;
