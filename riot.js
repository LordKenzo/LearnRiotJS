/* Library Based on Riot 1.0.0 for Accademical Purpose, @license MIT, (c) 2017 */

(function(riot) { 
  "use strict";

  var FN = {}, // Precompiled templates (JavaScript functions)
  template_escape = {"\\": "\\\\", "\n": "\\n", "\r": "\\r", "'": "\\'"},
  render_escape = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'};

  function default_escape_fn(str, key) {
    return str == undefined ? '' : (str+'').replace(/[&\"<>]/g, function(char) {
      return render_escape[char];
    });
  }

  riot.render = function(tmpl, data, escape_fn) {
    if (escape_fn === true) escape_fn = default_escape_fn;
    tmpl = tmpl || '';
  
    return (FN[tmpl] = FN[tmpl] || new Function("_", "e", "try { return '" +
      tmpl.replace(/[\\\n\r']/g, function(char) {
        return template_escape[char];
  
      }).replace(/{\s*([\w\.]+)\s*}/g, "' + (e?e(_.$1,'$1'):_.$1||(_.$1==undefined?'':_.$1)) + '")
        + "' } catch(e) { return '' }"
      )
  
    )(data, escape_fn);
  
  };
})(typeof window == "object" ? window.riot = {} : (function(){
  return exports;
})(exports));