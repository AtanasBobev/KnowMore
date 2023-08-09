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
      <option selected value="-" disabled>
        Category
      </option>
      <option value="">All</option>
      <option value="">Other</option>
      <optgroup label="Science">
        <option value="biology">Biology</option>
        <option value="chemistry">Chemistry</option>
        <option value="physics">Physics</option>
        <option value="astronomy">Astronomy</option>
        <option value="geology">Geology</option>
        <option value="psychology">Psychology</option>
        <option value="environmental">Environmental Science</option>
        <option value="neuroscience">Neuroscience</option>
        <option value="genetics">Genetics</option>
        <option value="other-science">Other Science</option>
      </optgroup>
      <optgroup label="History">
        <option value="ancient">Ancient History</option>
        <option value="medieval">Medieval History</option>
        <option value="renaissance">Renaissance</option>
        <option value="modern">Modern History</option>
        <option value="us">U.S. History</option>
        <option value="worldwar">World Wars</option>
        <option value="coldwar">Cold War</option>
        <option value="civilrights">Civil Rights Movement</option>
        <option value="explorers">Explorers</option>
        <option value="empires">Great Empires</option>
        <option value="other-history">Other History</option>
      </optgroup>
      <optgroup label="Math">
        <option value="algebra">Algebra</option>
        <option value="geometry">Geometry</option>
        <option value="calculus">Calculus</option>
        <option value="statistics">Statistics</option>
        <option value="trigonometry">Trigonometry</option>
        <option value="linearalgebra">Linear Algebra</option>
        <option value="discretemath">Discrete Mathematics</option>
        <option value="probability">Probability</option>
        <option value="numbertheory">Number Theory</option>
        <option value="other-math">Other Math</option>
      </optgroup>
      <optgroup label="Languages">
        <option value="english">English</option>
        <option value="spanish">Spanish</option>
        <option value="french">French</option>
        <option value="german">German</option>
        <option value="chinese">Chinese</option>
        <option value="japanese">Japanese</option>
        <option value="italian">Italian</option>
        <option value="arabic">Arabic</option>
        <option value="portuguese">Portuguese</option>
        <option value="russian">Russian</option>
        <option value="other-languages">Other Languages</option>
      </optgroup>
      <optgroup label="Geography">
        <option value="continents">Continents</option>
        <option value="countries">Countries</option>
        <option value="flags">Flags</option>
        <option value="capitals">Capitals</option>
        <option value="landmarks">Landmarks</option>
        <option value="population">Population</option>
        <option value="climate">Climate</option>
        <option value="naturalwonders">Natural Wonders</option>
        <option value="oceans">Oceans</option>
        <option value="other-geography">Other Geography</option>
      </optgroup>
      <optgroup label="Art">
        <option value="painting">Painting</option>
        <option value="sculpture">Sculpture</option>
        <option value="music">Music</option>
        <option value="architecture">Architecture</option>
        <option value="photography">Photography</option>
        <option value="film">Film</option>
        <option value="literature">Literature</option>
        <option value="performingarts">Performing Arts</option>
        <option value="modernart">Modern Art</option>
        <option value="other-art">Other Art</option>
      </optgroup>
      <optgroup label="Literature">
        <option value="classic">Classic Literature</option>
        <option value="modern">Modern Literature</option>
        <option value="poetry">Poetry</option>
        <option value="drama">Drama</option>
        <option value="fantasy">Fantasy</option>
        <option value="sciencefiction">Science Fiction</option>
        <option value="mystery">Mystery</option>
        <option value="horror">Horror</option>
        <option value="romance">Romance</option>
        <option value="other-literature">Other Literature</option>
      </optgroup>
      <optgroup label="Computer Science">
        <option value="programming">Programming</option>
        <option value="algorithms">Algorithms</option>
        <option value="databases">Databases</option>
        <option value="networking">Networking</option>
        <option value="webdev">Web Development</option>
        <option value="artificialintelligence">Artificial Intelligence</option>
        <option value="machinelearning">Machine Learning</option>
        <option value="cybersecurity">Cybersecurity</option>
        <option value="datascience">Data Science</option>
        <option value="other-computerscience">Other Computer Science</option>
      </optgroup>
      <optgroup label="Sports">
        <option value="football">Football</option>
        <option value="basketball">Basketball</option>
        <option value="soccer">Soccer</option>
        <option value="tennis">Tennis</option>
        <option value="golf">Golf</option>
        <option value="swimming">Swimming</option>
        <option value="volleyball">Volleyball</option>
        <option value="hockey">Hockey</option>
        <option value="cricket">Cricket</option>
        <option value="baseball">Baseball</option>
        <option value="other-sports">Other Sports</option>
      </optgroup>
      <optgroup label="Health and Wellness">
        <option value="nutrition">Nutrition</option>
        <option value="fitness">Fitness</option>
        <option value="meditation">Meditation</option>
        <option value="yoga">Yoga</option>
        <option value="mentalhealth">Mental Health</option>
        <option value="sleep">Sleep</option>
        <option value="stress">Stress Management</option>
        <option value="healthyrecipes">Healthy Recipes</option>
        <option value="wellness">Wellness Practices</option>
        <option value="other-health">Other Health and Wellness</option>
      </optgroup>
      <optgroup label="Science Fiction">
        <option value="starwars">Star Wars</option>
        <option value="startrek">Star Trek</option>
        <option value="dune">Dune</option>
        <option value="matrix">The Matrix</option>
        <option value="bladerunner">Blade Runner</option>
        <option value="cyberpunk">Cyberpunk</option>
        <option value="steampunk">Steampunk</option>
        <option value="time">Time Travel</option>
        <option value="aliens">Extraterrestrial Life</option>
        <option value="other-sciencefiction">Other Science Fiction</option>
      </optgroup>
    </select>
  );
};

export default SelectOptions;
