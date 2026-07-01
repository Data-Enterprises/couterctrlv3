import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx } from "../hooks";
import { useSubMarginActions } from "../hooks/useSubMarginActions";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import Input from "../../../components/inputs/Input";

const SubDeptsTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  const filteredSubDepts = ctx.subDepts.filter((sub) =>
    sub.desc.toLowerCase().includes(ctx.subDeptFitlerText.toLowerCase()),
  );

  const handleFilterTextChange = (x: string) => {
    dispatch(actions.setSubDeptFilterText(x));
  };

  const handleSubDeptClick = (id: number) => {
    const subs = [...ctx.subDepts];
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setSelectedSubDeptId(id));
    dispatch(actions.setSubDepts(subs));
  };

  if (ctx.loadingSubDepts) {
    return (
      <div className="relative h-[31vh]">
        <LoadingIndicator message="Loading Sub Departments..." />
      </div>
    );
  }

  return (
    <div
      className={`${ctx.subDepts.length > 0 ? "" : "hidden"} flex flex-col gap-2 relative bg-custom-white p-2 rounded-lg shadow-lg`}
    >
      <Input
        label="Sub Dept"
        value={ctx.subDeptFitlerText}
        setValue={handleFilterTextChange}
        className="py-1 text-[13px]"
      />
      <div className="grid grid-cols-2 gap-2 max-h-[430px] rounded-lg overflow-hidden overflow-y-auto">
        {filteredSubDepts.map((sub) => (
          <div
            key={sub.id}
            className={`${ctx.selectedSubDeptId === sub.id ? "bg-orange-200" : "bg-bkg/50"} py-1.5 rounded-lg shadow-lg text-[11px] text-center transition-all duration-200`}
            onClick={() => handleSubDeptClick(sub.id)}
          >
            {sub.desc}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubDeptsTablet;
