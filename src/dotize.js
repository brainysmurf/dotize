// Convert complex js object to dot notation js object
// url: https://github.com/vardars/dotize
// author: vardars

var dotize = dotize || {};

dotize.convert = function(obj, prefix) {
    var newObj = {};

    if ((!obj || typeof obj != "object") && !Array.isArray(obj)) {
        if (prefix) {
            newObj[prefix] = obj;
            return newObj;
        } else {
            return obj;
        }
    }

    function isNumber(f) {
        return !isNaN(parseInt(f));
    }

    function isEmptyObj(obj) {
        for (var prop in obj) {
            if (Object.hasOwnProperty.call(obj, prop))
                return false;
        }
    }

    function getFieldName(field, prefix, isRoot, isArrayItem, isArray) {
        if (isArray)
            return (prefix ? prefix : "") + (isNumber(field) ? "[" + field + "]" : (isRoot ? "" : ".") + field);
        else if (isArrayItem)
            return (prefix ? prefix : "") + "[" + field + "]";
        else
            return (prefix ? prefix + "." : "") + field;
    }

    return function recurse(o, p, isRoot) {
        var isArrayItem = Array.isArray(o);
        for (var f in o) {
            var currentProp = o[f];
            if (currentProp && typeof currentProp === "object") {
                if (Array.isArray(currentProp)) {
                    newObj = recurse(currentProp, getFieldName(f, p, isRoot, false, true), isArrayItem); // array
                } else {
                    if (isArrayItem && isEmptyObj(currentProp) == false) {
                        newObj = recurse(currentProp, getFieldName(f, p, isRoot, true)); // array item object
                    } else if (isEmptyObj(currentProp) == false) {
                        newObj = recurse(currentProp, getFieldName(f, p, isRoot)); // object
                    } else {
                        //
                    }
                }
            } else {
                if (isArrayItem || isNumber(f)) {
                    newObj[getFieldName(f, p, isRoot, true)] = currentProp; // array item primitive
                } else {
                    newObj[getFieldName(f, p, isRoot)] = currentProp; // primitive
                }
            }
        }

        return newObj;
    }(obj, prefix, true);
};

dotize.revert = function (source) {

  function arrayRecurse(parent, key, value) {
    var subkey, index;
    if (key.indexOf('].') !== -1) {
      index = key.slice(key.lastIndexOf('[')+1, key.lastIndexOf('].'));
      subkey = key.slice(key.lastIndexOf('].')+2);
      parent[index] = keyRecurse(parent[index] || {}, subkey, value);
      return parent;
    }
    if (key.lastIndexOf('[') === 0) {
      parent.push(value);
      return parent;
    }
    subkey = key.slice(0, key.lastIndexOf('['));
    index = parseInt(subkey.slice(1, subkey.length-1));
    parent[index] = arrayRecurse(parent[index] || [], subkey, value);
    return parent;
  }
  
  function keyRecurse (parent, key, value) {
    if (key.indexOf('.') === -1) {
      parent[key] = value;
      return parent;
    }
    var subkey = key.slice(0, key.indexOf('.'));
    parent[subkey] = keyRecurse(parent[subkey] || {}, key.slice(key.indexOf('.')+1), value);
    return parent;
  };
  
  var result;
  result = {};  // Has to be a hash
  Object.keys(source).forEach(function (sourceKey) {  
    var sourceValue = source[sourceKey];
    
    if (sourceKey.indexOf('[') === -1) 
      // Simple case
      keyRecurse(result, sourceKey, sourceValue);
    else {
      // Complicated case
      // We make values from outside in, figuring out which one to send it to
      // Assume there's only one [] for now, and it's at the end
      var step;
      step = function cycle (parent, key, value) {
        var subkey, lastSubkey, restKey, index, nextIndex, nextKey;
        if (key.indexOf('[') != key.lastIndexOf('[')) {  // what about object array array object?    
          subkey = key.slice(0, key.indexOf('['));
          restKey = key.slice(key.indexOf(']')+1);
          index = parseInt(key.slice(key.indexOf('[')+1, key.indexOf(']')));
          if (restKey[0] == '.') {
            // redo value so that it's the result of a key recurse
            // need to get the index, label it as a key originally
            index = parseInt(key.slice(key.indexOf('[')+1, key.indexOf(']')));
            nextKey = restKey.slice(1, restKey.indexOf('['));
            parent[subkey][index] = parent[subkey][index] || {};
            parent[subkey][index][nextKey] = arrayRecurse(parent[subkey][index][nextKey] || [], restKey.slice(1), value);
          } else {
            // do nothing
          }
        }
        subkey = key.slice(0, key.indexOf('['));
        restKey = key.slice(key.indexOf('['));  // key to assign
        parent[subkey] = parent[subkey] || [];
        return arrayRecurse(parent[subkey], restKey, value);
      }(result, sourceKey, sourceValue);
      keyRecurse(result, sourceKey.slice(0, sourceKey.indexOf('[')), step);      
    }
  });
  
  if ((Object.keys(result).length == 1) && result[""])
    return result[""];
  return result;
}


if (typeof module != "undefined") {
    module.exports = dotize;
}
