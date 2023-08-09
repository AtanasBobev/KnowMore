import parse from "html-react-parser";

const sortByTerm = async (arrayOfObjects) => {
  let sortedArray = await arrayOfObjects.sort((a, b) => {
    const termA = parse(a.term).props.children; // Extract text from parsed element
    const termB = parse(b.term).props.children; // Extract text from parsed element

    if (termA < termB) {
      return -1;
    }
    if (termA > termB) {
      return 1;
    }
    return 0;
  });
  return sortedArray;
};

export default sortByTerm;
