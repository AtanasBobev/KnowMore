import {useState} from "preact/hooks"
const SelectRefineSet = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setFurtherRefinements(value);
  };
  return (
    <select
    value={defaultEl}
    onChange={handleChange}
    id="likeSelect"
  >
    <option value="-" disabled>
      Sort
    </option>
    <option value="id" selected>Default</option>
    <option value="a-z">A-Z</option>
    <option value="z-a">Z-A</option>
    <option value="mostconfident">Well known</option>
    <option value="leastconfident">Least known</option>
  </select>
  );
};

export default SelectRefineSet;
