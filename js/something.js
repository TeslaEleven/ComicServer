/* 
 * AjaxPageParser jQuery Plugin
 * Made by Erik Terwan
 * 28 September 2015 - 0.1.3
 * 
 * This plugin is provided as-is and released under the terms of the MIT license.
 */
 
!function(t){t.fn.pageParser=function(e){function i(){if(u.each(function(e){var i=t(this);t(this).attr("data-ppid",e+1),t(this).on(a.trigger,function(t){return n(i),t.preventDefault(),!1})}),null!=a.initialElement&&a.dynamicUrl){l=!0;var e=t(a.initialElement).attr(a.urlAttribute),i={name:e,page:document.title,id:t(a.initialElement).attr("data-ppid")};history.pushState(i,document.title,e)}return t(window).on("popstate",function(){history.state&&(l&&0!=r?t("*[data-ppid="+history.state.id+"]").length>0&&n(t("*[data-ppid="+history.state.id+"]"),!0):r=1)}),u}function n(e,i){a.before.call(e);var n=e.attr(a.urlAttribute),r=n,l=e.attr("data-ppid");null!=a.parseElement&&(r+=" "+a.parseElement),setTimeout(function(){t(a.container).load(r,function(t,u,o){if("success"==u){var s=t.split("title>");s=s[1].split("</");var c=s[0];if(a.dynamicUrl&&1!=i){var d={name:r,page:c,id:l};history.pushState(d,c,n)}a.setTitle&&(document.title=c),a.finished.call(e)}else"error"==u&&a.error.call(o.status)})},a.loadDelay)}var a=t.extend({container:null,dynamicUrl:!0,initialElement:null,parseElement:null,setTitle:!0,trigger:"click",urlAttribute:"href",loadDelay:null,before:function(){},finished:function(){},error:function(){}},e),r=0,l=!1,u=this;return i()}}(jQuery);
