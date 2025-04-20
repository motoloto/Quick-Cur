function removeElement(elementId) {
  const elem = document.getElementById(elementId);
  if (elem) elem.remove();
}

const elementId = "quick_cur";
const NumberFormat = new Intl.NumberFormat('en-US');

document.addEventListener("click", (event) => {
  const popup = document.getElementById(elementId);
  if (event.target.id !== elementId && popup) {
    popup.remove();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  removeElement(elementId);

  const popText = `${request.targetCcy} $ ${NumberFormat.format(request.amount.toFixed(2))} &emsp; <b>Rate:&emsp;${request.totalRate.toFixed(3)}</b>`;
  const lastExchangeText = request.lastExchange
    ? `<br><small>Last: <br> ${request.lastExchange.to} $ <span style="color: ${request.lastExchange.amount <= request.amount ? 'green' : 'red'};">${NumberFormat.format(request.lastExchange.amount)}</span> <b>from</b> ${request.lastExchange.from} $ ${NumberFormat.format(request.lastExchange.sourceAmount)}</small>`
    : '';

  (function (popText, lastExchangeText) {
    const markerTextChar = "\ufeff";
    const markerId = elementId;

    const doc = window.document;
    let sel, range;

    if (doc.selection && doc.selection.createRange) {
      range = doc.selection.createRange().duplicate();
      range.collapse(false);
      range.pasteHTML(`<span id="${markerId}" style="position: relative;">&#xfeff;</span>`);
    } else if (window.getSelection) {
      sel = window.getSelection();
      range = sel.getRangeAt(0).cloneRange();
      range.collapse(false);

      const markerEl = doc.createElement("span");
      markerEl.id = markerId;
      markerEl.textContent = markerTextChar;
      range.insertNode(markerEl);

      const selectionEl = doc.createElement("div");
      selectionEl.id = elementId;
      selectionEl.innerHTML = popText + lastExchangeText;
      selectionEl.className = "content-popup";
      doc.body.appendChild(selectionEl);

      const rect = markerEl.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      selectionEl.style.left = `${scrollLeft + rect.left + rect.width}px`;
      selectionEl.style.top = `${scrollTop + rect.top + rect.height}px`;

      markerEl.remove();
    }
  })(popText, lastExchangeText);

  sendResponse({ message: 'Currency exchanging is finished' });
});
