import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import { navigation } from "../../components/navigation/utils";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";

const Settings = () => {
  const user = useAppSelector((state) => state.user);
  const [username, setUsername] = useState<string>(user.username);
  const [password, setPassword] = useState<string>(user.password);
  const [email, setEmail] = useState<string>(user.email);
  const [firstName, setFirstName] = useState<string>(user.firstName);
  const [lastName, setLastName] = useState<string>(user.lastName);

  const handleRoutePref = (route: string | number) => {
    console.log("Set route pref to: ", route);
  };

  useEffect(() => {
    // On mount
  }, []);

  return (
    <div className="w-full h-[calc(100vh-3rem)] p-4 select-none flex justify-center items-center">
      <div className="bg-custom-white p-4 rounded-lg shadow-lg w-[40%]">
        <div className="text-xl font-medium text-center mb-4">
          Profile Settings
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            title="Username"
            type="text"
            query={username}
            name={"username"}
            isSimple={true}
            setText={(text) => setUsername(text)}
          />
          <SingleSelect
            label="Default Page"
            data={navigation}
            valueKey="href"
            displayKey="name"
            onSelect={handleRoutePref}
          />
          <TextInput
            title="Password"
            type="password"
            query={password}
            name="password"
            isSimple={true}
            setText={(text) => setPassword(text)}
          />
          <TextInput
            title="Email"
            query={email}
            name="email"
            type="text"
            isSimple={true}
            setText={(text) => setEmail(text)}
          />
          <TextInput
            title="First Name"
            query={firstName}
            type="text"
            isSimple={true}
            name="firstName"
            setText={(text) => setFirstName(text)}
          />
          <TextInput
            title="Last Name"
            query={lastName}
            type="text"
            isSimple={true}
            name="lastName"
            setText={(text) => setLastName(text)}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
