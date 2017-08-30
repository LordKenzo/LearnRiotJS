/* Library Based on Riot 1.0.0 for Accademical Purpose, @license MIT, (c) 2017 */

(function(riot) { 
  "use strict";

  riot.observable = function(el) {
    var callbacks = {}, slice = [].slice;

    el.on = function(events, fn) {
      console.log('events:',events)
      if (typeof fn === "function") {
        events.replace(/[^\s]+/g, function(name, pos) {
          console.log(name, pos, fn);
          (callbacks[name] = callbacks[name] || []).push(fn);
          fn.typed = pos > 0;
          console.log(fn.typed);
        });
      }
      return el;
    };
  
    el.trigger = function(name) {
      var args = slice.call(arguments, 1),
        fns = callbacks[name] || [];
      console.log('triggers', name,  args)
      for (var i = 0, fn; (fn = fns[i]); ++i) {
        console.log(i, fn.one)
        if (!fn.busy) {
          fn.busy = true;
          console.log([name].concat(args));
          fn.apply(el, fn.typed ? [name].concat(args) : args);
          if (fn.one) {fns.splice(i, 1); i--; }
          fn.busy = false;
        }
      }
  
      return el;
    };
  
    return el;
  
  };

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