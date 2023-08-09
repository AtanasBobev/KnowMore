//DEPRECATED
import axiosInstance from "./axiosConfig";
const copySet = (set, toast) => {
  axiosInstance
    .post("/set/copy", { set_id: set[0].set_id })
    .then((res) => {
      toast.success("We copied your set. You are current browsing the copy");
      navigate(`/set/${res.data.set_id}`);
    })
    .catch((err) => {
      toast.error(
        "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
      );
    });
};
const likeSet = (token, setLikedSet, set, toast) => {
  if (!token.user_id) {
    toast("You need to be logged in to like a set.");
    return;
  }
  axiosInstance.post("/set/like", { set_id: set[0].set_id }).then((res) => {
    setLikedSet(true);
    toast.success("Set liked! You can view it in your profile.");
  });
};
const dislikeSet = (token, setLikedSet, set, toast) => {
  if (!token.user_id) {
    toast("You need to be logged in to dislike a set.");
    return;
  }
  axiosInstance.post("/set/dislike", { set_id: set[0].set_id }).then((res) => {
    setLikedSet(false);
  });
};
const shareSet = (toast) => {
  try {
    let url = window.location.href;
    window.navigator.clipboard.writeText(url);
    toast.success("Share link has been copied to clipboard");
  } catch (err) {
    toast.error(
      "It seems like the share functionality doesn't work on your browser"
    );
  }
};
const exportSet = (token, set, toast) => {
  if (!token.user_id) {
    toast("You need to be logged in to export a set.");
    return;
  }
  axiosInstance
    .get(`/set/export/${set[0].set_id}`)
    .then((res) => {
      const json = res.data;
      const fields = Object.keys(json[0]);
      const replacer = function (key, value) {
        return value === null ? "" : value;
      };
      let csv = json.map(function (row) {
        return fields

          .map(function (fieldName) {
            return JSON.stringify(row[fieldName], replacer);
          })
          .join(",");
      });
      csv.unshift(fields.join(",")); // add header column
      csv = csv.join("\r\n");

      //save the .csv file
      const element = document.createElement("a");
      const file = new Blob([csv], {
        type: "text/csv",
      });
      element.href = URL.createObjectURL(file);
      element.download = `${set[0].name}.csv`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();

      toast.success("Set exported as .csv! Check your downloads folder.");
    })
    .catch((err) => {
      toast.error(
        "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
      );
    });
};
const deleteSet = (token, set, toast) => {
  if (!token.user_id) {
    toast("You need to be logged in to delete a set.");
    return;
  }
  //check if user is owner of set
  if (token.user_id !== set[0].user_id) {
    toast("You can only delete sets you own.");
    return;
  }
  if (!confirm("Are you sure you want to delete this set?")) {
    return false;
  }
  axiosInstance
    .post(`/set/delete`, {
      set_id: set[0].set_id,
    })
    .then((response) => {
      setTimeout(() => {
        navigate(`/sets`);
      }, 1500);
      toast.success("Set deleted! Navigating to your sets!");
    })
    .catch((err) => {
      toast.error(
        "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
      );
    });
};
export { copySet, likeSet, dislikeSet, shareSet, exportSet, deleteSet };
