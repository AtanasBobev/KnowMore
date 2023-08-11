import {useState} from "preact/hooks"
const SelectOptions = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setCategory(value);
  };
  return (
    <select
    value={defaultEl}
    onChange={handleChange}
    id="categorySelect"
  >
    <option value="-" disabled>
      Category
    </option>
    <option value="">All</option>
    <option value="biology/chemistry">Biology/Chemistry</option>
    <option value="math">Math</option>
    <option value="history">History</option>
    <option value="english">English</option>
    <option value="otherLang">Other languages</option>
    <option value="programming">Programming</option>
    <option value="art">Art</option>
    <option value="sports">Sports</option>
    <option value="sciencefiction">Science Fiction</option>
  </select>
  );
};

export default SelectOptions;
