function removeElement(elementId){
  var elem = document.getElementById(elementId);
  if(elem) elem.remove();
}

const elementId = "quick_cur";
const NumberFormat = new Intl.NumberFormat('en-US');


document.addEventListener("click", function(event){
  if(event.target.id != elementId){
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
        selectionEl.style.border = "solid darkblue 1px";
        selectionEl.style.borderRadius= "5px";
        selectionEl.style.backgroundColor = "GhostWhite";
        selectionEl.style.padding="2px 4px 2px 4px";
        selectionEl.style.boxShadow=" rgba(0, 0, 0, 0.2) 0px 1px 3px";
        selectionEl.innerHTML = `${popText}`;
        selectionEl.style.position = "absolute";
        selectionEl.style.zIndex="10000000000000000";

        doc.body.appendChild(selectionEl);
      }

      // Find markerEl position http://www.quirksmode.org/js/findpos.html
      var obj = markerEl;
      var left = 0, top = 20;
      do {
        left += obj.offsetLeft;
        top += obj.offsetTop;
      } while (obj = obj.offsetParent);

      // Move the button into place.
      // Substitute your jQuery stuff in here
      selectionEl.style.left = left + "px";
      selectionEl.style.top = top + "px";

      markerEl.parentNode.removeChild(markerEl);
    }

  })(popText);
  sendResponse({ message: 'Background has received that message ?' });
});

// 