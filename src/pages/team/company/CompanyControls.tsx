
const CompanyControls = () => {

  return (
    <div className="absolute w-">
      <div className="bg-custom-white rounded-lg shadow-lg p-4 grid grid-cols-4 gap-2">
        <button className="btn-themeBlue">Create</button>
        <button className="btn-themeBlue">Update</button>
        <button className="btn-themeBlue">Delete</button>
        <button className="btn-themeBlue">Assign User</button>
      </div>
    </div>
  )
};

export default CompanyControls;