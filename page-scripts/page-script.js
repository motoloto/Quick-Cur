// page-script.js

// 替DOM新增一個元素
var p = document.createElement("p");
p.textContent = "This paragraph was added by a page script.";
p.setAttribute("id", "page-script-para");
document.body.appendChild(p);

// 替 window 定義一個新的屬性
window.foo = "This global variable was added by a page script";

// 重新定義內建的 window.confirm 函數
window.confirm = function() {
  alert("The page script has also redefined 'confirm'");
}