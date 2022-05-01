document.getElementById("confirmButton").addEventListener('click', handleConfirm);
document.getElementById("gotoFeedButton").addEventListener('click', handleGotoFeed);

function handleConfirm() {
    addFeedURL(document.getElementById("input").value);
    console.log(userFeedURLs);
}

function delFav() {
  localStorage.removeItem('userFeedURLs');
  localStorage.removeItem('oldkey');
}

function handleGotoFeed() {
    if (userFeedURLs.length == 0) {
        alert("You haven't entered any RSS feeds");
        return;
    }
  if(localStorage.getItem('userFeedURLs') === null) {
    localStorage.setItem('userFeedURLs', userFeedURLs);
  } else {
  var annoy = localStorage.getItem('userFeedURLs');
  localStorage.setItem('oldkey', annoy);
  var old = localStorage.getItem('oldkey');
  localStorage.setItem('userFeedURLs', old + "," + userFeedURLs);
  }
    window.location.href = './';
}

function addFeedURL(url) {
    RemoveHtmlTagsFromURL(url);
    if (url == "") {
        alert("Please enter a RSS URL!")
        return;
    }
    userFeedURLs.push(url);
    document.getElementById("input").value = "";

    var listElement = "<li class=\"list-group-item border border-dark bg-white\"><h5>" + url + "</h5></li>"
    console.log(listElement);
    document.getElementById("urlList").insertAdjacentHTML('beforeend', listElement)
}


function RemoveHtmlTagsFromURL(url) {
    return url.replace(/(<([^>]+)>)/ig, "");
}
