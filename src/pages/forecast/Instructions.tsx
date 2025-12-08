const upcs: string[] = ["7239277080", "88855900112", "88855900104", "..."];

const instructions: string[] = [
  "Select date range",
  "Then stores/group",
  "Upload a .csv file",
  "One header: upc",
  "One upc per line",
];

const Instructions = () => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-8 text-sm">
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
