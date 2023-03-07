function removeElement(elementId) {
  var elem = document.getElementById(elementId);
  if (elem) elem.remove();
}

const elementId = "quick_cur";
const NumberFormat = new Intl.NumberFormat('en-US');


document.addEventListener("click", function (event) {
  if (event.target.id != elementId) {
    document.getElementById(elementId) && document.getElementById(elementId).remove();
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  removeElement(elementId);
  const popText = `${request.targetCcy} $ ${NumberFormat.format(request.amount.toFixed(2))}`;
  // Callback for that request
  // markSelection();
  (function (popText) {
    var markerTextChar = "\ufeff";
    var markerTextCharEntity = "&#xfeff;";

    var markerEl, markerId = elementId;

    var selectionEl;


    var doc = window.document;
    var sel, range;
    // Branch for IE <= 8 
    if (doc.selection && doc.selection.createRange) {
      // Clone the TextRange and collapse
      range = doc.selection.createRange().duplicate();
      range.collapse(false);

      // Create the marker element containing a single invisible character by creating literal HTML and insert it
      range.pasteHTML('<span id="' + markerId + '" style="position: relative;">' + markerTextCharEntity + '</span>');
      markerEl = doc.getElementById(markerId);
    } else if (window.getSelection) {
      sel = window.getSelection();
      range = sel.getRangeAt(0).cloneRange();
      range.collapse(false);

      // Create the marker element containing a single invisible character using DOM methods and insert it
      markerEl = doc.createElement("span");
      markerEl.id = markerId;
      markerEl.appendChild(doc.createTextNode(markerTextChar));
      range.insertNode(markerEl);
    }

    if (markerEl) {
      // Lazily create element to be placed next to the selection
      if (!selectionEl) {
        selectionEl = doc.createElement("div");
        selectionEl.id = elementId;
        selectionEl.innerHTML = `${popText}`;
        selectionEl.className = "content-popup";

        doc.body.appendChild(selectionEl);
      }

      // Find markerEl position http://www.quirksmode.org/js/findpos.html
      var obj = markerEl;
      var padLeft = 0, padTop = 0;

      // old way to get element position
      // do {
      //   padLeft += obj.offsetLeft;
      //   padTop += obj.offsetTop;
      // } while (obj = obj.offsetParent);

      // Move the button into place.
      // Substitute your jQuery stuff in here
      // selectionEl.style.left = (left+document.body.scrollLeft) + "px";
      // selectionEl.style.top = (top+document.body.scrollTop) + "px";

      // new way to get position
      var scrollTop =
        document.documentElement.scrollTop
        || document.body.scrollTop
        || 0;
      var scrollLeft =
        document.documentElement.scrollLeft
        || document.body.scrollLeft
        || 0;
      var selection = document.getSelection();
      var rect = selection.getRangeAt(0).getBoundingClientRect();
      var scrollTop = scrollTop + rect.top + padTop + rect.height;
      var scrollLeft = scrollLeft + rect.left + padLeft + rect.width;
      selectionEl.style.left = scrollLeft + "px";
      selectionEl.style.top = scrollTop + "px";



      markerEl.parentNode.removeChild(markerEl);
    }

  })(popText);
  sendResponse({ message: 'Background has received that message ?' });
});
