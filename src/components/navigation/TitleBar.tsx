import logo from "../../assets/dcr_counterctrl-favicon_32.png";
import { BellIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector } from "../../hooks";

const TitleBar = () => {
  const user = useAppSelector((state) => state.user);

  return (
    <div className="h-12 w-full flex">
      <div className="w-48 flex items-center shadow-md shadow-content/20">
        <img src={logo} alt="Logo" className="h-8 w-8 m-2 inline-block" />
        <div className="font-medium">CounterCtrl</div>
      </div>
      <div className="shadow-md shadow-content/10 w-[calc(100vw-12rem)] flex justify-between">
      {/* Replace this with the user's name coming from the api */}
        <div className="ml-4 flex items-center font-medium">Welcome Stephen</div>
        <div className="flex items-center h-full">
          <BellIcon className="h-6 w-6 m-2 cursor-pointer hover:text-accent1 transition-colors" />
          <div className="flex items-center px-6 ml-4 border-l-2">
            <div className="text-sm font-medium">{user.username}</div>
            <ChevronDownIcon className="h-4 w-4 m-2 cursor-pointer hover:text-accent1 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
