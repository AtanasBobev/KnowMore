import translate from "../../utils/languagesHandler";
const SelectOptions = (props) => {
  const handleChange = (e) => {
    const value = e.target.value;
    props.setSortBy(value);
  };
  return (
    <select onChange={handleChange} id="selectSort">
      <option selected disabled>{translate("options.SortBy")}</option>
      <option value="name">{translate("options.Name")}</option>
      <option value="date_created">{translate("options.DateCreated")}</option>
      <option value="likes">{translate("options.Likes")}</option>
      <option value="date_modified">{translate("options.DateModified")}</option>
    </select>
  );
};

export default SelectOptions;