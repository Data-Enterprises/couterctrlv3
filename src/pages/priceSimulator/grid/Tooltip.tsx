import { useState } from "react";
import QuestionIcon from "../../../svgs/QuestionIcon";

const InfoIcon = ({ tooltip }: { tooltip: string }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-1 relative">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <QuestionIcon height={16} width={16} />
      </div>
      {visible && (
        <div
          className="text-sm absolute bottom-3 left-3 bg-bkg"
          style={{ zIndex: 9999 }}
        >
          {tooltip} howdy howdy howdy
        </div>
      )}
    </div>
  );
};
export default InfoIcon;
