import {
  UserIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  KeyIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/solid";

interface MainFormOptionProps {
  title: string;
  handleFormSelect: (val: number) => void;
  form: number;
}
const MainFormOption = ({
  title,
  handleFormSelect,
  form,
}: MainFormOptionProps) => {
  const renderIcon = () => {
    switch (form) {
      case 1:
        return <UserIcon className="w-12 h-12" />;
      case 2:
        return <UserGroupIcon className="w-12 h-12" />;
      case 3:
        return <BuildingStorefrontIcon className="w-12 h-12" />;
      case 4:
        return <BuildingOfficeIcon className="w-12 h-12" />;
      case 5:
        return <KeyIcon className="w-12 h-12" />;
      default:
        return null;
    }
  };
  return (
    <div
      className="p-3 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center"
      onClick={() => handleFormSelect(form)}
    >
      <div>{renderIcon()}</div>
      <div>{title}</div>
    </div>
  );
};

export default MainFormOption;
